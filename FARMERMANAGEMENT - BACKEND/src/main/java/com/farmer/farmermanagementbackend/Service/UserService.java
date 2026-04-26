package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.Model.User;
import com.farmer.farmermanagementbackend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository repo;

    // ── REGISTER ──────────────────────────────────────────────
    public User register(User user) {
        // Check email already exists
        if (repo.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email already registered");
        }

        if ("FARMER".equalsIgnoreCase(user.getRole())) {
            user.setStatus("pending");   // needs admin approval
            user.setFarmerId(null);      // assigned after approval
        } else {
            user.setStatus("active");
        }

        return repo.save(user);
    }

    // ── LOGIN ─────────────────────────────────────────────────
    public User login(String email, String password) {
        User user = repo.findByEmail(email);
        if (user == null) return null;
        if (!user.getPassword().equals(password)) return null;
        if ("pending".equals(user.getStatus())) return null;
        if ("inactive".equals(user.getStatus())) return null;
        return user;
    }

    // ── APPROVE FARMER ────────────────────────────────────────
    // Called by admin — activates farmer and generates farmer ID
    public User approveUser(int id) {
        User user = repo.findById(id).orElse(null);
        if (user == null) return null;

        user.setStatus("active");

        // Auto-generate farmer ID only for FARMER role
        if ("FARMER".equalsIgnoreCase(user.getRole()) && user.getFarmerId() == null) {
            String farmerId = generateFarmerId();
            user.setFarmerId(farmerId);
        }

        return repo.save(user);
    }

    // ── GENERATE FARMER ID ────────────────────────────────────
    // Generates F001, F002, F003 ... automatically
    private String generateFarmerId() {
        long count = repo.countByRoleAndFarmerIdIsNotNull("FARMER");
        return String.format("F%03d", count + 1);
    }

    // ── OTHER OPERATIONS ──────────────────────────────────────
    public List<User> getAllUsers() {
        return repo.findAll();
    }

    public List<User> getUsersByRole(String role) {
        return repo.findAll().stream()
                .filter(u -> role.equalsIgnoreCase(u.getRole()))
                .collect(Collectors.toList());
    }

    public User getUserById(int id) {
        return repo.findById(id).orElse(null);
    }

    public User updateUser(int id, User updated) {
        User user = repo.findById(id).orElse(null);
        if (user == null) return null;
        user.setName(updated.getName());
        user.setPhone(updated.getPhone());
        user.setNic(updated.getNic());
        user.setFarmSize(updated.getFarmSize());
        user.setFarmLocation(updated.getFarmLocation());
        user.setYearsOfExperience(updated.getYearsOfExperience());
        user.setDeliveryAddress(updated.getDeliveryAddress());
        return repo.save(user);
    }

    public void deleteUser(int id) {
        repo.deleteById(id);
    }

    public void deactivateUser(int id) {
        User user = repo.findById(id).orElse(null);
        if (user != null) {
            user.setStatus("inactive");
            repo.save(user);
        }
    }
}