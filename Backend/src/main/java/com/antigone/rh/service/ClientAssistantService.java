package com.antigone.rh.service;

import com.antigone.rh.dto.ClientAssistantActionDTO;
import com.antigone.rh.dto.ClientAssistantAskRequest;
import com.antigone.rh.dto.ClientAssistantMessageDTO;
import com.antigone.rh.dto.ClientAssistantResponse;
import com.antigone.rh.dto.ReunionRequest;
import com.antigone.rh.entity.Client;
import com.antigone.rh.entity.ClientAssistantMessage;
import com.antigone.rh.entity.ClientAssistantThread;
import com.antigone.rh.entity.MediaPlan;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.TypeReunion;
import com.antigone.rh.repository.ClientAssistantMessageRepository;
import com.antigone.rh.repository.ClientAssistantThreadRepository;
import com.antigone.rh.repository.ClientRepository;
import com.antigone.rh.repository.MediaPlanRepository;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.ReunionRepository;
import com.antigone.rh.repository.TacheRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientAssistantService {

    private final ClientRepository clientRepository;
    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final MediaPlanRepository mediaPlanRepository;
    private final ReunionRepository reunionRepository;
    private final TacheService tacheService;
    private final MediaPlanService mediaPlanService;
    private final ReunionService reunionService;
    private final ClientAssistantThreadRepository threadRepository;
    private final ClientAssistantMessageRepository messageRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public ClientAssistantResponse ask(ClientAssistantAskRequest request) {
        if (request.getClientId() == null || request.getMessage() == null || request.getMessage().isBlank()) {
            throw new RuntimeException("clientId and message are required");
        }

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        ClientAssistantThread thread = resolveThread(request.getThreadId(), client);

        messageRepository.save(ClientAssistantMessage.builder()
                .thread(thread)
                .role("USER")
                .content(request.getMessage().trim())
                .createdAt(LocalDateTime.now())
                .build());

        String context = buildContext(client);
        String prompt = buildPrompt(client, context, request.getMessage());

        String llmRaw = geminiClient.generateContent(prompt);
        LlmResponse llmResponse = parseLlmResponse(llmRaw);

        ExecutionResult execution = executeActions(client, llmResponse.actions);

        Set<String> warnings = new LinkedHashSet<>();
        warnings.addAll(llmResponse.warnings);
        warnings.addAll(execution.warnings);

        Set<String> missingInfo = new LinkedHashSet<>();
        missingInfo.addAll(llmResponse.missingInfo);
        missingInfo.addAll(execution.missingInfo);

        ClientAssistantResponse response = ClientAssistantResponse.builder()
                .reply(llmResponse.reply)
                .executedActions(execution.executedActions)
                .warnings(new ArrayList<>(warnings))
                .missingInfo(new ArrayList<>(missingInfo))
                .threadId(thread.getId())
                .build();

        messageRepository.save(ClientAssistantMessage.builder()
                .thread(thread)
                .role("ASSISTANT")
                .content(response.getReply())
                .actionsJson(writeJsonSafe(response.getExecutedActions()))
                .missingInfoJson(writeJsonSafe(response.getMissingInfo()))
                .createdAt(LocalDateTime.now())
                .build());

        thread.setUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);

        return response;
    }

    @Transactional(readOnly = true)
    public List<ClientAssistantMessageDTO> getThreadMessages(String threadId, Long clientId) {
        if (threadId == null || threadId.isBlank() || clientId == null) {
            throw new RuntimeException("threadId and clientId are required");
        }

        ClientAssistantThread thread = threadRepository.findByIdAndClientId(threadId, clientId)
                .orElseThrow(() -> new RuntimeException("Thread not found"));

        return messageRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId()).stream()
                .map(this::toMessageDTO)
                .collect(Collectors.toList());
    }

    private ClientAssistantThread resolveThread(String threadId, Client client) {
        if (threadId != null && !threadId.isBlank()) {
            Optional<ClientAssistantThread> existing = threadRepository.findByIdAndClientId(threadId, client.getId());
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        ClientAssistantThread thread = ClientAssistantThread.builder()
                .id(UUID.randomUUID().toString())
                .client(client)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return threadRepository.save(thread);
    }

    private String buildContext(Client client) {
        List<Projet> projets = projetRepository.findByClientId(client.getId());
        List<Long> projetIds = projets.stream().map(Projet::getId).collect(Collectors.toList());
        List<Tache> taches = projetIds.isEmpty() ? List.of() : tacheRepository.findByProjetIdIn(projetIds);
        Map<Long, List<Tache>> tachesByProjet = taches.stream()
                .collect(Collectors.groupingBy(t -> t.getProjet().getId()));

        List<MediaPlan> mediaPlans = mediaPlanRepository.findByClientId(client.getId());
        LocalDate today = LocalDate.now();
        LocalDate endWindow = today.plusDays(45);
        List<MediaPlan> upcomingMediaPlans = mediaPlans.stream()
                .filter(mp -> mp.getDatePublication() == null || !mp.getDatePublication().isBefore(today.minusDays(7)))
                .sorted(Comparator.comparing(MediaPlan::getDatePublication, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(20)
                .collect(Collectors.toList());

        List<com.antigone.rh.entity.Reunion> reunions = reunionRepository
                .findByClientParticipantIdAndDateReunionBetween(client.getId(), today.minusDays(7), endWindow);

        StringBuilder sb = new StringBuilder();
        sb.append("today: ").append(today).append("\n");
        sb.append("client: id=").append(client.getId()).append(", nom=").append(client.getNom()).append("\n");

        sb.append("projects:\n");
        for (Projet projet : projets) {
            List<Tache> projectTasks = tachesByProjet.getOrDefault(projet.getId(), List.of());
            long todo = projectTasks.stream().filter(t -> t.getStatut() != null && "TODO".equals(t.getStatut().name())).count();
            long inProgress = projectTasks.stream().filter(t -> t.getStatut() != null && "IN_PROGRESS".equals(t.getStatut().name())).count();
            long done = projectTasks.stream().filter(t -> t.getStatut() != null && "DONE".equals(t.getStatut().name())).count();

            sb.append("- id=").append(projet.getId())
                    .append(" nom=").append(projet.getNom())
                    .append(" statut=").append(projet.getStatut() != null ? projet.getStatut().name() : "")
                    .append(" debut=").append(projet.getDateDebut())
                    .append(" fin=").append(projet.getDateFin())
                    .append(" tasks(todo=").append(todo)
                    .append(", in_progress=").append(inProgress)
                    .append(", done=").append(done)
                    .append(")\n");

            List<Tache> upcomingTasks = projectTasks.stream()
                    .filter(t -> t.getDateEcheance() != null)
                    .sorted(Comparator.comparing(Tache::getDateEcheance))
                    .limit(5)
                    .collect(Collectors.toList());
            for (Tache task : upcomingTasks) {
                sb.append("  task id=").append(task.getId())
                        .append(" titre=").append(task.getTitre())
                        .append(" statut=").append(task.getStatut() != null ? task.getStatut().name() : "")
                        .append(" echeance=").append(task.getDateEcheance())
                        .append("\n");
            }
        }

        sb.append("media_plans:\n");
        for (MediaPlan mp : upcomingMediaPlans) {
            sb.append("- id=").append(mp.getId())
                    .append(" date=").append(mp.getDatePublication())
                    .append(" titre=").append(mp.getTitre())
                    .append(" statut=").append(mp.getStatut() != null ? mp.getStatut().name() : "")
                    .append(" rectifs=").append(cleanText(mp.getRectifs()))
                    .append("\n");
        }

        sb.append("reunions:\n");
        reunions.stream()
                .sorted(Comparator.comparing(com.antigone.rh.entity.Reunion::getDateReunion))
                .limit(10)
                .forEach(reunion -> sb.append("- id=").append(reunion.getId())
                        .append(" date=").append(reunion.getDateReunion())
                        .append(" debut=").append(reunion.getHeureDebut())
                        .append(" type=").append(reunion.getTypeReunion() != null ? reunion.getTypeReunion().name() : "")
                        .append(" titre=").append(reunion.getTitre())
                        .append("\n"));

        return sb.toString();
    }

    private String buildPrompt(Client client, String context, String userMessage) {
        return "You are the client portal assistant. Return JSON only, no markdown. "
                + "Use fields: reply (string), actions (array), missing_info (array), warnings (array). "
                + "Action types: CREATE_TASK, ADD_RECTIF, CREATE_MEETING, REQUEST_INFO. "
                + "Only use IDs from context, never invent. "
                + "If info is missing, add it to missing_info and keep actions empty. "
                + "For CREATE_TASK payload: {projetId, titre, description?, dateEcheance?, urgente?}. "
                + "For ADD_RECTIF payload: {mediaPlanId, rectif}. "
                + "For CREATE_MEETING payload: {projetId, titre, dateReunion, heureDebut, heureFin?, typeReunion, plateforme?, lienReunion?, lieu?}. "
                + "Context:\n" + context + "\nUser message: " + userMessage;
    }

    private LlmResponse parseLlmResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return LlmResponse.empty("Je n ai pas assez de details pour repondre.");
        }

        String json = extractJson(raw);
        if (json == null) {
            return LlmResponse.empty("Je n ai pas assez de details pour repondre.");
        }

        try {
            JsonNode node = objectMapper.readTree(json);
            String reply = node.path("reply").asText("").trim();
            if (reply.isBlank()) {
                reply = "Je n ai pas assez de details pour repondre.";
            }

            List<AssistantAction> actions = parseActions(node.path("actions"));
            List<String> warnings = parseStringArray(node.path("warnings"));
            List<String> missingInfo = parseStringArray(node.path("missing_info"));

            return new LlmResponse(reply, actions, warnings, missingInfo);
        } catch (Exception ex) {
            return LlmResponse.empty("Je n ai pas assez de details pour repondre.");
        }
    }

    private ExecutionResult executeActions(Client client, List<AssistantAction> actions) {
        List<ClientAssistantActionDTO> executed = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> missingInfo = new ArrayList<>();

        if (actions == null || actions.isEmpty()) {
            return new ExecutionResult(executed, warnings, missingInfo);
        }

        for (AssistantAction action : actions) {
            String type = action.type == null ? "" : action.type.trim().toUpperCase();
            switch (type) {
                case "CREATE_TASK" -> handleCreateTask(client, action, executed, warnings, missingInfo);
                case "ADD_RECTIF" -> handleAddRectif(client, action, executed, warnings, missingInfo);
                case "CREATE_MEETING" -> handleCreateMeeting(client, action, executed, warnings, missingInfo);
                case "REQUEST_INFO" -> missingInfo.addAll(action.missingInfo);
                default -> warnings.add("Unsupported action: " + action.type);
            }
        }

        return new ExecutionResult(executed, warnings, missingInfo);
    }

    private void handleCreateTask(Client client, AssistantAction action,
                                  List<ClientAssistantActionDTO> executed,
                                  List<String> warnings,
                                  List<String> missingInfo) {
        Long projetId = asLong(action.payload, "projetId");
        String titre = asText(action.payload, "titre");
        if (projetId == null || titre.isBlank()) {
            missingInfo.add("projetId or titre is required for CREATE_TASK");
            executed.add(actionResult("CREATE_TASK", "Task not created", "failed"));
            return;
        }

        Projet projet = projetRepository.findById(projetId).orElse(null);
        if (projet == null || projet.getClient() == null || !projet.getClient().getId().equals(client.getId())) {
            warnings.add("Project not linked to client for CREATE_TASK");
            executed.add(actionResult("CREATE_TASK", "Task not created", "failed"));
            return;
        }

        Tache tache = new Tache();
        tache.setTitre(titre);
        tache.setDescription(asText(action.payload, "description"));
        tache.setUrgente(asBoolean(action.payload, "urgente"));
        tache.setDateEcheance(parseDate(asText(action.payload, "dateEcheance")));

        tacheService.create(projetId, tache);
        executed.add(actionResult("CREATE_TASK", "Task created: " + titre, "done"));
    }

    private void handleAddRectif(Client client, AssistantAction action,
                                 List<ClientAssistantActionDTO> executed,
                                 List<String> warnings,
                                 List<String> missingInfo) {
        Long mediaPlanId = asLong(action.payload, "mediaPlanId");
        String rectif = asText(action.payload, "rectif");
        if (mediaPlanId == null || rectif.isBlank()) {
            missingInfo.add("mediaPlanId and rectif are required for ADD_RECTIF");
            executed.add(actionResult("ADD_RECTIF", "Rectif not added", "failed"));
            return;
        }

        MediaPlan mp = mediaPlanRepository.findById(mediaPlanId).orElse(null);
        if (mp == null || mp.getClient() == null || !mp.getClient().getId().equals(client.getId())) {
            warnings.add("Media plan not linked to client for ADD_RECTIF");
            executed.add(actionResult("ADD_RECTIF", "Rectif not added", "failed"));
            return;
        }

        String existing = mp.getRectifs();
        String combined = appendRectif(existing, rectif);
        mediaPlanService.updateRectifs(mediaPlanId, combined);
        executed.add(actionResult("ADD_RECTIF", "Rectif added to media plan " + mediaPlanId, "done"));
    }

    private void handleCreateMeeting(Client client, AssistantAction action,
                                     List<ClientAssistantActionDTO> executed,
                                     List<String> warnings,
                                     List<String> missingInfo) {
        Long projetId = asLong(action.payload, "projetId");
        String titre = asText(action.payload, "titre");
        LocalDate dateReunion = parseDate(asText(action.payload, "dateReunion"));
        LocalTime heureDebut = parseTime(asText(action.payload, "heureDebut"));

        if (projetId == null || titre.isBlank() || dateReunion == null || heureDebut == null) {
            missingInfo.add("projetId, titre, dateReunion and heureDebut are required for CREATE_MEETING");
            executed.add(actionResult("CREATE_MEETING", "Meeting not created", "failed"));
            return;
        }

        Projet projet = projetRepository.findById(projetId).orElse(null);
        if (projet == null || projet.getClient() == null || !projet.getClient().getId().equals(client.getId())) {
            warnings.add("Project not linked to client for CREATE_MEETING");
            executed.add(actionResult("CREATE_MEETING", "Meeting not created", "failed"));
            return;
        }

        Long initiateurId = resolveInitiateurId(projet);
        if (initiateurId == null) {
            warnings.add("No initiateur found for CREATE_MEETING");
            executed.add(actionResult("CREATE_MEETING", "Meeting not created", "failed"));
            return;
        }

        String typeReunionStr = asText(action.payload, "typeReunion");
        TypeReunion typeReunion = parseTypeReunion(typeReunionStr);

        ReunionRequest reunionRequest = new ReunionRequest();
        reunionRequest.setTitre(titre);
        reunionRequest.setDateReunion(dateReunion);
        reunionRequest.setHeureDebut(heureDebut);
        reunionRequest.setHeureFin(parseTime(asText(action.payload, "heureFin")));
        reunionRequest.setTypeReunion(typeReunion);
        reunionRequest.setPlateforme(asText(action.payload, "plateforme"));
        reunionRequest.setLienReunion(asText(action.payload, "lienReunion"));
        reunionRequest.setLieu(asText(action.payload, "lieu"));
        reunionRequest.setClientParticipantId(client.getId());

        reunionService.create(reunionRequest, initiateurId);
        executed.add(actionResult("CREATE_MEETING", "Meeting created for " + dateReunion, "done"));
    }

    private Long resolveInitiateurId(Projet projet) {
        if (projet.getChefDeProjet() != null) {
            return projet.getChefDeProjet().getId();
        }
        if (projet.getChefsDeProjet() != null && !projet.getChefsDeProjet().isEmpty()) {
            return projet.getChefsDeProjet().get(0).getId();
        }
        if (projet.getCreateur() != null) {
            return projet.getCreateur().getId();
        }
        return null;
    }

    private String appendRectif(String existing, String rectif) {
        if (existing == null || existing.isBlank()) {
            return "- " + rectif.trim();
        }
        return existing.trim() + "\n- " + rectif.trim();
    }

    private ClientAssistantActionDTO actionResult(String type, String label, String status) {
        return ClientAssistantActionDTO.builder()
                .type(type)
                .label(label)
                .status(status)
                .build();
    }

    private String extractJson(String raw) {
        String trimmed = raw.trim();
        int first = trimmed.indexOf('{');
        int last = trimmed.lastIndexOf('}');
        if (first < 0 || last <= first) {
            return null;
        }
        return trimmed.substring(first, last + 1);
    }

    private List<String> parseStringArray(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> items = new ArrayList<>();
        node.forEach(item -> items.add(item.asText("")));
        return items.stream().filter(s -> s != null && !s.isBlank()).collect(Collectors.toList());
    }

    private List<AssistantAction> parseActions(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<AssistantAction> actions = new ArrayList<>();
        node.forEach(item -> {
            String type = item.path("type").asText("");
            Map<String, Object> payload = new LinkedHashMap<>();
            JsonNode payloadNode = item.path("payload");
            if (payloadNode.isObject()) {
                payloadNode.fields().forEachRemaining(entry -> {
                    if (entry.getValue().isNumber()) {
                        payload.put(entry.getKey(), entry.getValue().numberValue());
                    } else if (entry.getValue().isBoolean()) {
                        payload.put(entry.getKey(), entry.getValue().asBoolean());
                    } else {
                        payload.put(entry.getKey(), entry.getValue().asText(null));
                    }
                });
            }
            List<String> missing = parseStringArray(item.path("missing_info"));
            actions.add(new AssistantAction(type, payload, missing));
        });
        return actions;
    }

    private String writeJsonSafe(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private ClientAssistantMessageDTO toMessageDTO(ClientAssistantMessage message) {
        return ClientAssistantMessageDTO.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .actions(readJsonList(message.getActionsJson(), new TypeReference<List<ClientAssistantActionDTO>>() {}))
                .missingInfo(readJsonList(message.getMissingInfoJson(), new TypeReference<List<String>>() {}))
                .build();
    }

    private <T> List<T> readJsonList(String value, TypeReference<List<T>> typeRef) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(value, typeRef);
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String asText(Map<String, Object> payload, String key) {
        if (payload == null) return "";
        Object value = payload.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Long asLong(Map<String, Object> payload, String key) {
        if (payload == null) return null;
        Object value = payload.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        if (value != null) {
            try {
                return Long.parseLong(value.toString());
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private boolean asBoolean(Map<String, Object> payload, String key) {
        if (payload == null) return false;
        Object value = payload.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value != null) {
            return Boolean.parseBoolean(value.toString());
        }
        return false;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private TypeReunion parseTypeReunion(String value) {
        if (value == null || value.isBlank()) {
            return TypeReunion.EN_LIGNE;
        }
        String normalized = value.trim().toUpperCase();
        if ("PRESENTIEL".equals(normalized)) {
            return TypeReunion.PRESENTIEL;
        }
        return TypeReunion.EN_LIGNE;
    }

    private String cleanText(String value) {
        if (value == null) return "";
        String trimmed = value.replaceAll("\\s+", " ").trim();
        if (trimmed.length() > 140) {
            return trimmed.substring(0, 140) + "...";
        }
        return trimmed;
    }

    private static class LlmResponse {
        private final String reply;
        private final List<AssistantAction> actions;
        private final List<String> warnings;
        private final List<String> missingInfo;

        private LlmResponse(String reply, List<AssistantAction> actions, List<String> warnings, List<String> missingInfo) {
            this.reply = reply;
            this.actions = actions;
            this.warnings = warnings;
            this.missingInfo = missingInfo;
        }

        static LlmResponse empty(String reply) {
            return new LlmResponse(reply, List.of(), List.of(), List.of());
        }
    }

    private static class AssistantAction {
        private final String type;
        private final Map<String, Object> payload;
        private final List<String> missingInfo;

        private AssistantAction(String type, Map<String, Object> payload, List<String> missingInfo) {
            this.type = type;
            this.payload = payload;
            this.missingInfo = missingInfo;
        }
    }

    private static class ExecutionResult {
        private final List<ClientAssistantActionDTO> executedActions;
        private final List<String> warnings;
        private final List<String> missingInfo;

        private ExecutionResult(List<ClientAssistantActionDTO> executedActions, List<String> warnings, List<String> missingInfo) {
            this.executedActions = executedActions;
            this.warnings = warnings;
            this.missingInfo = missingInfo;
        }
    }
}
