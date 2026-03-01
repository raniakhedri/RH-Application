package com.antigone.rh.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:antigone.rh.app@gmail.com}")
    private String fromEmail;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void sendCredentials(String toEmail, String employeNom, String username, String password) {
        String subject = "Antigone RH - Vos identifiants de connexion";
        String htmlBody = buildCredentialsHtml(employeNom, username, password);

        if (mailEnabled) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                mailSender.send(mimeMessage);
                log.info("Email envoyé à {} avec les identifiants", toEmail);
            } catch (MessagingException e) {
                log.error("Erreur lors de l'envoi de l'email à {}: {}", toEmail, e.getMessage());
            } catch (Exception e) {
                log.error("Erreur inattendue lors de l'envoi de l'email à {}: {}", toEmail, e.getMessage());
            }
        } else {
            log.info("=== EMAIL (mode simulation) ===");
            log.info("À: {}", toEmail);
            log.info("Sujet: {}", subject);
            log.info("Corps HTML généré pour: {}", employeNom);
            log.info("=== FIN EMAIL ===");
        }
    }

    private String buildCredentialsHtml(String employeNom, String username, String password) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Antigone RH - Identifiants</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:40px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%%;">
            
                      <!-- HEADER -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #f36904 0%%, #cc5500 100%%); border-radius:16px 16px 0 0; padding:36px 40px; text-align:center;">
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center">
                                <div style="width:56px; height:56px; background-color:rgba(255,255,255,0.2); border-radius:14px; display:inline-block; line-height:56px; margin-bottom:16px;">
                                  <span style="font-size:28px; color:#ffffff;">&#128188;</span>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td align="center">
                                <h1 style="margin:0; font-size:28px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.3);">Antigone RH</h1>
                                <p style="margin:8px 0 0; font-size:14px; color:#ffffff; font-weight:500; text-shadow:0 1px 3px rgba(0,0,0,0.2);">Gestion des Ressources Humaines</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
            
                      <!-- BODY -->
                      <tr>
                        <td style="background-color:#ffffff; padding:40px;">
            
                          <!-- Greeting -->
                          <p style="margin:0 0 8px; font-size:20px; font-weight:600; color:#1a1a2e;">
                            Bonjour %s 👋
                          </p>
                          <p style="margin:0 0 28px; font-size:15px; color:#64748b; line-height:1.6;">
                            Votre compte a été créé avec succès sur la plateforme <strong style="color:#f36904;">Antigone RH</strong>. Vous trouverez ci-dessous vos identifiants de connexion.
                          </p>
            
                          <!-- Credentials Card -->
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#fff8f2; border:1px solid #ffddc2; border-radius:12px; overflow:hidden;">
                            <tr>
                              <td style="padding:6px 24px 0; border-bottom:none;">
                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="padding:18px 0 14px;">
                                      <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#a64400; text-transform:uppercase; letter-spacing:1px;">Nom d'utilisateur</p>
                                      <p style="margin:0; font-size:18px; font-weight:700; color:#1a1a2e; font-family:'Courier New',Courier,monospace; letter-spacing:0.5px;">%s</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:0 24px;">
                                <div style="height:1px; background-color:#ffddc2;"></div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:0 24px 6px;">
                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="padding:14px 0 18px;">
                                      <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#a64400; text-transform:uppercase; letter-spacing:1px;">Mot de passe</p>
                                      <p style="margin:0; font-size:18px; font-weight:700; color:#1a1a2e; font-family:'Courier New',Courier,monospace; letter-spacing:0.5px;">%s</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
            
                          <!-- Warning -->
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                            <tr>
                              <td style="background-color:#fef3cd; border-left:4px solid #f59e0b; border-radius:0 8px 8px 0; padding:14px 18px;">
                                <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
                                  &#9888;&#65039; <strong>Important :</strong> Veuillez changer votre mot de passe lors de votre première connexion pour des raisons de sécurité.
                                </p>
                              </td>
                            </tr>
                          </table>
            
                        </td>
                      </tr>
            
                      <!-- FOOTER -->
                      <tr>
                        <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; border-radius:0 0 16px 16px; padding:28px 40px; text-align:center;">
                          <p style="margin:0 0 6px; font-size:13px; color:#94a3b8;">
                            Cet email a été envoyé automatiquement par
                          </p>
                          <p style="margin:0 0 16px; font-size:14px; font-weight:600; color:#f36904;">
                            Antigone RH
                          </p>
                          <div style="height:1px; background-color:#e2e8f0; margin:0 40px 16px;"></div>
                          <p style="margin:0; font-size:11px; color:#cbd5e1;">
                            &copy; 2025 Antigone RH. Tous droits réservés.
                          </p>
                        </td>
                      </tr>
            
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(employeNom, username, password);
    }
}
