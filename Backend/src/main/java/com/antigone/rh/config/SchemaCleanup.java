package com.antigone.rh.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class SchemaCleanup implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    // Entity columns per table (snake_case as Hibernate generates them)
    private static final Map<String, Set<String>> ENTITY_COLUMNS = Map.of(
            "pointages", Set.of("id", "employe_id", "date_pointage", "heure_entree", "heure_sortie",
                    "ip_entree", "ssid_entree", "retard_minutes",
                    "statut", "sur_reseau_entreprise", "teletravail", "created_at"),
            "heartbeats", Set.of("id", "employe_id", "timestamp", "ip_address", "ssid",
                    "actif", "sur_reseau_entreprise"),
            "presence_confirmations", Set.of("id", "employe_id", "timestamp", "confirmed"));

    @Override
    public void run(String... args) {
        for (var entry : ENTITY_COLUMNS.entrySet()) {
            String table = entry.getKey();
            Set<String> expectedColumns = entry.getValue();
            cleanOrphanColumns(table, expectedColumns);
        }
    }

    private void cleanOrphanColumns(String tableName, Set<String> expectedColumns) {
        try {
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                    "SELECT column_name, is_nullable FROM information_schema.columns " +
                            "WHERE table_name = ? AND table_schema = 'public'",
                    tableName);

            for (Map<String, Object> col : columns) {
                String colName = (String) col.get("column_name");
                String isNullable = (String) col.get("is_nullable");

                if (!expectedColumns.contains(colName) && "NO".equals(isNullable)) {
                    log.info("Making orphan column {}.{} nullable", tableName, colName);
                    jdbcTemplate.execute(
                            "ALTER TABLE " + tableName + " ALTER COLUMN \"" + colName + "\" DROP NOT NULL");
                }
            }
        } catch (Exception e) {
            log.warn("Could not clean orphan columns for {}: {}", tableName, e.getMessage());
        }
    }
}
