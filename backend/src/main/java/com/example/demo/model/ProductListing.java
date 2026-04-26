package com.example.demo.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * ProductListing entity — integrated from product-listing module into VegLife system.
 * Linked to User (farmer) via farmerId (matching User.id).
 */
@Entity
@Table(name = "product_listing")
public class ProductListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "listing_id")
    @JsonProperty("listing_id")
    private Integer listingId;

    /** References User.id (role = FARMER) */
    @Column(name = "farmer_id")
    @JsonProperty("farmer_id")
    private Integer farmerId;

    @Column(name = "title")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_visible")
    @JsonProperty("is_visible")
    private Boolean isVisible;

    @Column(name = "listed_at")
    @JsonProperty("listed_at")
    private LocalDateTime listedAt;

    @Column(name = "expires_at")
    @JsonProperty("expires_at")
    private LocalDateTime expiresAt;

    /** Risk level based on expiry: HIGH (<24h), MEDIUM (<48h), LOW (>48h) */
    @Column(name = "risk_level")
    @JsonProperty("risk_level")
    private String riskLevel;

    /** Auto-calculated discount % based on riskLevel: HIGH=30, MEDIUM=15, LOW=0 */
    @Column(name = "suggested_discount")
    @JsonProperty("suggested_discount")
    private Integer suggestedDiscount;

    // ===== Inline stock fields (denormalised from FarmerStock) =====
    @Column(name = "price_per_kg")
    @JsonProperty("price_per_kg")
    private Double pricePerKg;

    @Column(name = "quantity_kg")
    @JsonProperty("quantity_kg")
    private Double quantityKg;

    @Column(name = "category")
    private String category;

    @Column(name = "availability_status")
    @JsonProperty("availability_status")
    private String availabilityStatus; // available, low, out_of_stock

    // ===== Extra display fields =====
    @Column(name = "image", columnDefinition = "TEXT")
    private String image;

    @Column(name = "farmer_name")
    @JsonProperty("farmer_name")
    private String farmerName;

    @Column(name = "farmer_location")
    @JsonProperty("farmer_location")
    private String farmerLocation;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "reviews")
    private Integer reviews;

    // ===== Getters & Setters =====
    public Integer getListingId() { return listingId; }
    public void setListingId(Integer listingId) { this.listingId = listingId; }

    public Integer getFarmerId() { return farmerId; }
    public void setFarmerId(Integer farmerId) { this.farmerId = farmerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsVisible() { return isVisible; }
    public void setIsVisible(Boolean isVisible) { this.isVisible = isVisible; }

    public LocalDateTime getListedAt() { return listedAt; }
    public void setListedAt(LocalDateTime listedAt) { this.listedAt = listedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Integer getSuggestedDiscount() { return suggestedDiscount; }
    public void setSuggestedDiscount(Integer suggestedDiscount) { this.suggestedDiscount = suggestedDiscount; }

    public Double getPricePerKg() { return pricePerKg; }
    public void setPricePerKg(Double pricePerKg) { this.pricePerKg = pricePerKg; }

    public Double getQuantityKg() { return quantityKg; }
    public void setQuantityKg(Double quantityKg) { this.quantityKg = quantityKg; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }

    public String getFarmerLocation() { return farmerLocation; }
    public void setFarmerLocation(String farmerLocation) { this.farmerLocation = farmerLocation; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviews() { return reviews; }
    public void setReviews(Integer reviews) { this.reviews = reviews; }
}
