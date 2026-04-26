package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import com.example.demo.model.User;
import com.example.demo.service.UserService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService service;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = service.register(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            User found = service.login(user.getEmail(), user.getPassword());
            if (found != null) return ResponseEntity.ok(found);
            return ResponseEntity.status(401).body("Invalid email or password.");
        } catch (Exception e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @GetMapping
    public List<User> getAllUsers() { return service.getAllUsers(); }

    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable String role) {
        return service.getUsersByRole(role);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        User user = service.getUserById(id);
        if (user != null) return ResponseEntity.ok(user);
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updated) {
        try {
            User user = service.updateUser(id, updated);
            if (user != null) return ResponseEntity.ok(user);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable int id) {
        boolean deleted = service.deleteUser(id);
        if (deleted) return ResponseEntity.ok("User deleted successfully.");
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<?> approve(@PathVariable int id) {
        try {
            service.approveUser(id);
            return ResponseEntity.ok("User approved successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<?> deactivate(@PathVariable int id) {
        try {
            service.deactivateUser(id);
            return ResponseEntity.ok("User deactivated.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            service.sendForgotPasswordOtp(body.get("email"));
            return ResponseEntity.ok("OTP sent to " + body.get("email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        boolean valid = service.verifyOtp(body.get("email"), body.get("otp"));
        if (valid) return ResponseEntity.ok("OTP verified.");
        return ResponseEntity.status(400).body("Invalid or expired OTP.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            service.resetPassword(body.get("email"), body.get("newPassword"));
            return ResponseEntity.ok("Password updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/acknowledge-update/{id}")
    public ResponseEntity<?> acknowledgeUpdate(@PathVariable int id) {
        User u = service.getUserById(id);
        if (u == null) return ResponseEntity.notFound().build();
        u.setProfileUpdatePending(false);
        // Keep lastUpdateNote so "Last Updated" date remains visible in tile
        service.saveUser(u);
        return ResponseEntity.ok("Update acknowledged.");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            service.changePassword(body.get("email"), body.get("currentPassword"), body.get("newPassword"));
            return ResponseEntity.ok("Password changed successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
