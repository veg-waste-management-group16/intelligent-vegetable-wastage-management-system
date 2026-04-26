package com.example.demo.service;

import com.example.demo.model.Notification;
import com.example.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repo;

    // ===== SEND (Admin) =====
    public Notification send(String title, String message, String targetRole, String priority, String sentByName) {
        if (title == null || title.trim().isEmpty()) throw new RuntimeException("Title is required.");
        if (message == null || message.trim().isEmpty()) throw new RuntimeException("Message is required.");
        if (!List.of("FARMER", "CUSTOMER", "ALL", "ADMIN").contains(targetRole))
            throw new RuntimeException("Invalid targetRole. Use FARMER, CUSTOMER, or ALL.");
        if (!List.of("INFO", "WARNING", "URGENT").contains(priority))
            priority = "INFO";

        Notification n = new Notification();
        n.setTitle(title.trim());
        n.setMessage(message.trim());
        n.setTargetRole(targetRole);
        n.setPriority(priority);
        n.setSentByName(sentByName != null ? sentByName : "Admin");
        n.setSentAt(LocalDateTime.now());
        return repo.save(n);
    }

    // ===== GET ALL (Admin view — includes ADMIN-targeted notifications) =====
    public List<Notification> getAll() {
        return repo.findAllForAdmin();
    }

    // ===== GET FOR ROLE (Farmer / Customer view) =====
    public List<Notification> getForRole(String role) {
        return repo.findForRole(role.toUpperCase());
    }

    // ===== DELETE (Admin) =====
    public boolean delete(Long id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }
}
