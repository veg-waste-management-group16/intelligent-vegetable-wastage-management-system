package com.example.demo.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;

    @Column(unique = true)
    private String email;

    private String phone;
    private String nic;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String role;
    private String status;

    // Farmer index number (auto-generated: F001, F002, ...)
    private String farmerIndex;

    // Farmer-specific fields
    private String farmSize;
    private String farmLocation;
    private Integer yearsOfExperience;
    private String cultivatedVegetables;

    // Farmer cultivated area (hectares)
    private Double cultivatedAreaHectares;

    // Profile update flag — set when farmer edits profile so admin sees it
    private Boolean profileUpdatePending;
    private String  lastUpdateNote;

    // Customer-specific fields
    private String billingAddress;
    private String deliveryAddress;

    // Profile picture stored as base64 string
    @Column(columnDefinition = "LONGTEXT")
    private String profilePicture;

    public Double getCultivatedAreaHectares() { return cultivatedAreaHectares; }
    public void setCultivatedAreaHectares(Double v) { this.cultivatedAreaHectares = v; }
    public Boolean getProfileUpdatePending() { return profileUpdatePending; }
    public void setProfileUpdatePending(Boolean v) { this.profileUpdatePending = v; }
    public String getLastUpdateNote() { return lastUpdateNote; }
    public void setLastUpdateNote(String v) { this.lastUpdateNote = v; }

    // OTP fields for forgot password
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String otpCode;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime otpExpiry;

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFarmerIndex() { return farmerIndex; }
    public void setFarmerIndex(String farmerIndex) { this.farmerIndex = farmerIndex; }
    public String getFarmSize() { return farmSize; }
    public void setFarmSize(String farmSize) { this.farmSize = farmSize; }
    public String getFarmLocation() { return farmLocation; }
    public void setFarmLocation(String farmLocation) { this.farmLocation = farmLocation; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
    public String getCultivatedVegetables() { return cultivatedVegetables; }
    public void setCultivatedVegetables(String v) { this.cultivatedVegetables = v; }
    public String getBillingAddress() { return billingAddress; }
    public void setBillingAddress(String billingAddress) { this.billingAddress = billingAddress; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    public LocalDateTime getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }
}
