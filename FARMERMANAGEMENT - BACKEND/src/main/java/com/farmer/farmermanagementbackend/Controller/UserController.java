package com.farmer.farmermanagementbackend.Controller;

import com.farmer.farmermanagementbackend.Model.User;
import com.farmer.farmermanagementbackend.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService service;

    // ── REGISTER ──────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = service.register(user);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    // ── LOGIN ─────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");
        User found = service.login(email, password);

        if (found != null) {
            return ResponseEntity.ok(found);
        }
        return ResponseEntity.status(401)
                .body("Invalid credentials or account not active/pending approval");
    }

    // ── GET ALL ───────────────────────────────────────────────
    @GetMapping
    public List<User> getAllUsers() {
        return service.getAllUsers();
    }

    // ── GET BY ROLE ───────────────────────────────────────────
    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable String role) {
        return service.getUsersByRole(role);
    }

    // ── GET BY ID ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        User user = service.getUserById(id);
        if (user != null) return ResponseEntity.ok(user);
        return ResponseEntity.notFound().build();
    }

    // ── UPDATE ────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updated) {
        User user = service.updateUser(id, updated);
        if (user != null) return ResponseEntity.ok(user);
        return ResponseEntity.notFound().build();
    }

    // ── DELETE ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable int id) {
        service.deleteUser(id);
        return ResponseEntity.ok("Deleted");
    }

    // ── APPROVE FARMER (admin only) ───────────────────────────
    @PutMapping("/approve/{id}")
    public ResponseEntity<?> approve(@PathVariable int id) {
        User user = service.approveUser(id);
        if (user != null) {
            return ResponseEntity.ok(Map.of(
                    "message", "Farmer approved",
                    "farmerId", user.getFarmerId(),
                    "status", user.getStatus()
            ));
        }
        return ResponseEntity.notFound().build();
    }

    // ── DEACTIVATE ────────────────────────────────────────────
    @PutMapping("/deactivate/{id}")
    public ResponseEntity<?> deactivate(@PathVariable int id) {
        service.deactivateUser(id);
        return ResponseEntity.ok("Deactivated");
    }
}