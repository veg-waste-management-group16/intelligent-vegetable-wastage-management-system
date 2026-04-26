package com.example.demo.repository;

import com.example.demo.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Get all notifications for admin — newest first
    List<Notification> findAllByOrderBySentAtDesc();

    // Get notifications for a specific role: returns FARMER-specific + ALL
    @Query("SELECT n FROM Notification n WHERE n.targetRole = :role OR n.targetRole = 'ALL' ORDER BY n.sentAt DESC")
    List<Notification> findForRole(@Param("role") String role);

    // Admin sees everything including ADMIN-targeted notifications
    @Query("SELECT n FROM Notification n WHERE n.targetRole = 'ADMIN' OR n.targetRole = 'FARMER' OR n.targetRole = 'CUSTOMER' OR n.targetRole = 'ALL' ORDER BY n.sentAt DESC")
    List<Notification> findAllForAdmin();
}
