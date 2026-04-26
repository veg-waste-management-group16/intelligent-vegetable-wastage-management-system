package com.example.demo;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedAdmin(UserRepository repo) {
        return args -> {
            if (repo.findByEmail("admin@veglife.com") == null) {
                User admin = new User();
                admin.setName("VegLife Admin");
                admin.setEmail("admin@veglife.com");
                admin.setPassword(new BCryptPasswordEncoder().encode("Admin@123"));
                admin.setRole("ADMIN");
                admin.setStatus("active");
                admin.setPhone("0771234567");
                admin.setNic("199012345678");
                repo.save(admin);
                System.out.println("==============================================");
                System.out.println("  VegLife Admin account created:");
                System.out.println("  Email   : admin@veglife.com");
                System.out.println("  Password: Admin@123");
                System.out.println("==============================================");
            }
        };
    }
}
