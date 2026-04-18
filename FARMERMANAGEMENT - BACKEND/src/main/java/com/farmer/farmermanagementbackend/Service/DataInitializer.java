package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.Model.User;
import com.farmer.farmermanagementbackend.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedAdmin(UserRepository repo) {
        return args -> {
            User admin = repo.findByEmail("admin@veglife.com");
            if (admin == null) {
                admin = new User();
                admin.setName("VegLife Admin");
                admin.setEmail("admin@veglife.com");
                admin.setRole("ADMIN");
                admin.setStatus("active");
                admin.setPhone("0771234567");
                admin.setNic("199012345678");
            }
            admin.setPassword("Admin@123");
            repo.save(admin);
            System.out.println("==============================================");
            System.out.println("  VegLife Admin account configured:");
            System.out.println("  Email   : admin@veglife.com");
            System.out.println("  Password: Admin@123");
            System.out.println("==============================================");
        };
    }
}
