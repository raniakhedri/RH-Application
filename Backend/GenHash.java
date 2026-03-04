import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        System.out.println("ADMIN_HASH=" + enc.encode("Admin@2026"));
        System.out.println("USER_HASH=" + enc.encode("User@2026"));
    }
}
