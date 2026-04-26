package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import com.example.demo.model.User;
import com.example.demo.model.Notification;
import com.example.demo.service.NotificationService;
import com.example.demo.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository repo;

    @Autowired
    private NotificationService notificationService;

    // JavaMailSender is optional — only injected if mail is configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ===== VALIDATION HELPERS =====

    private void validatePhone(String phone) {
        if (phone == null || !phone.matches("^[0-9]{10}$")) {
            throw new RuntimeException("Phone number must be exactly 10 digits.");
        }
    }

    private void validateNic(String nic) {
        if (nic == null || nic.trim().isEmpty()) {
            throw new RuntimeException("NIC is required.");
        }
        if (!nic.matches("^[0-9]{9}[VvXx]$") && !nic.matches("^[0-9]{12}$")) {
            throw new RuntimeException("NIC must be 9 digits followed by V or X (e.g. 123456789V), or 12 digits.");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }
        if (!password.matches(".*[a-zA-Z].*")) {
            throw new RuntimeException("Password must contain at least one letter.");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new RuntimeException("Password must contain at least one special character (e.g. @, #, !).");
        }
    }

    // ===== GENERATE FARMER INDEX =====

    private synchronized String generateFarmerIndex() {
        Integer max = repo.findMaxFarmerIndexNumber();
        int next = (max == null ? 0 : max) + 1;
        return String.format("F%03d", next);
    }

    // ===== REGISTER =====

    public User register(User user) {
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Cannot self-register as ADMIN.");
        }
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required.");
        }
        if (user.getEmail() == null || !user.getEmail().matches("^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")) {
            throw new RuntimeException("A valid email is required.");
        }
        validatePassword(user.getPassword());
        validatePhone(user.getPhone());
        validateNic(user.getNic());

        if (user.getYearsOfExperience() != null && user.getYearsOfExperience() < 0) {
            throw new RuntimeException("Years of experience cannot be negative.");
        }
        if (repo.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("An account with this email already exists.");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if ("FARMER".equalsIgnoreCase(user.getRole())) {
            user.setStatus("pending");
            // Auto-assign farmer index (F001, F002, ...)
            user.setFarmerIndex(generateFarmerIndex());
        } else {
            user.setStatus("active");
        }

        return repo.save(user);
    }

    // ===== LOGIN =====

    public User login(String email, String password) {
        User user = repo.findByEmail(email);
        if (user == null) return null;
        if (!passwordEncoder.matches(password, user.getPassword())) return null;
        if ("FARMER".equalsIgnoreCase(user.getRole()) && "pending".equals(user.getStatus())) {
            throw new RuntimeException("Your account is pending approval by the admin.");
        }
        if ("inactive".equals(user.getStatus())) {
            throw new RuntimeException("Your account is inactive. Contact admin.");
        }
        return user;
    }

    // ===== GET =====

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

    // ===== UPDATE =====

    public User updateUser(int id, User updated) {
        User user = repo.findById(id).orElse(null);
        if (user == null) return null;

        if (updated.getName() == null || updated.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required.");
        }
        validatePhone(updated.getPhone());
        validateNic(updated.getNic());

        // Only allow permitted fields to be updated (role, email, password, farmerIndex NOT changeable here)
        if (updated.getYearsOfExperience() != null && updated.getYearsOfExperience() < 0) {
            throw new RuntimeException("Years of experience cannot be negative.");
        }
        user.setName(updated.getName());
        user.setPhone(updated.getPhone());
        user.setNic(updated.getNic());
        user.setFarmSize(updated.getFarmSize());
        user.setFarmLocation(updated.getFarmLocation());
        user.setYearsOfExperience(updated.getYearsOfExperience());
        user.setCultivatedVegetables(updated.getCultivatedVegetables());
        user.setCultivatedAreaHectares(updated.getCultivatedAreaHectares());
        user.setDeliveryAddress(updated.getDeliveryAddress());
        if (updated.getProfilePicture() != null) {
            user.setProfilePicture(updated.getProfilePicture());
        }
        String timestamp = java.time.LocalDateTime.now().toString().substring(0,16).replace("T"," ");
        if ("FARMER".equalsIgnoreCase(user.getRole())) {
            user.setProfileUpdatePending(true);
            user.setLastUpdateNote("Updated at " + timestamp);
            try {
                notificationService.send(
                    "Farmer Profile Updated",
                    "Farmer " + user.getName() + " (" + user.getEmail() + ") has updated their profile at " + timestamp + ". Please review their information.",
                    "ADMIN", "INFO", "System"
                );
            } catch (Exception ignored) {}
        } else if ("CUSTOMER".equalsIgnoreCase(user.getRole())) {
            user.setLastUpdateNote("Updated at " + timestamp);
            try {
                notificationService.send(
                    "Customer Profile Updated",
                    "Customer " + user.getName() + " (" + user.getEmail() + ") has updated their profile at " + timestamp + ".",
                    "ADMIN", "INFO", "System"
                );
            } catch (Exception ignored) {}
        }
        return repo.save(user);
    }

    // ===== SAVE (direct) =====

    public User saveUser(User user) {
        return repo.save(user);
    }

    // ===== DELETE =====

    public boolean deleteUser(int id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    // ===== APPROVE / DEACTIVATE =====

    public void approveUser(int id) {
        User user = repo.findById(id).orElse(null);
        if (user != null) { user.setStatus("active"); repo.save(user); }
    }

    public void deactivateUser(int id) {
        User user = repo.findById(id).orElse(null);
        if (user != null) { user.setStatus("inactive"); repo.save(user); }
    }

    // ===== FORGOT PASSWORD — SEND OTP =====

    public void sendForgotPasswordOtp(String email) {
        User user = repo.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("No account found with this email address.");
        }

        String otp = String.format("%06d", new Random().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        repo.save(user);

        if (mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(email);
                msg.setSubject("VegLife — Password Reset OTP");
                msg.setText(
                    "Hello " + user.getName() + ",\n\n" +
                    "Your OTP for resetting your VegLife password is:\n\n" +
                    "  " + otp + "\n\n" +
                    "This code is valid for 10 minutes.\n\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "— The VegLife Team"
                );
                mailSender.send(msg);
            } catch (Exception e) {
                System.err.println("VegLife: OTP email send failed: " + e.getMessage());
            }
        } else {
            System.out.println("==============================================");
            System.out.println("  VegLife OTP (dev mode — no mail server)");
            System.out.println("  Email: " + email + "  |  OTP: " + otp);
            System.out.println("==============================================");
        }
    }

    // ===== VERIFY OTP =====

    public boolean verifyOtp(String email, String otp) {
        User user = repo.findByEmail(email);
        if (user == null) return false;
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) return false;
        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) return false;
        return user.getOtpCode().equals(otp);
    }

    // ===== RESET PASSWORD =====

    public void resetPassword(String email, String newPassword) {
        User user = repo.findByEmail(email);
        if (user == null) throw new RuntimeException("User not found.");
        validatePassword(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        repo.save(user);
    }

    // ===== CHANGE PASSWORD =====

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = repo.findByEmail(email);
        if (user == null) throw new RuntimeException("User not found.");
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }
        validatePassword(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        repo.save(user);
    }
}
