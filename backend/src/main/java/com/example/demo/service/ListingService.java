package com.example.demo.service;

import com.example.demo.model.ProductListing;
import com.example.demo.repository.ProductListingRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ListingService {

    @Autowired
    private ProductListingRepository repository;

    // ===== RISK & DISCOUNT HELPERS =====

    private String calcRiskLevel(LocalDateTime expiresAt) {
        if (expiresAt == null) return "LOW";
        long hours = Duration.between(LocalDateTime.now(), expiresAt).toHours();
        if (hours <= 24) return "HIGH";
        if (hours <= 48) return "MEDIUM";
        return "LOW";
    }

    private int calcDiscount(String riskLevel) {
        if (riskLevel == null) return 0;
        switch (riskLevel) {
            case "HIGH":   return 30;
            case "MEDIUM": return 15;
            default:       return 0;
        }
    }

    private int getRiskScore(String risk) {
        if (risk == null) return 0;
        switch (risk) {
            case "HIGH":   return 3;
            case "MEDIUM": return 2;
            case "LOW":    return 1;
            default:       return 0;
        }
    }

    // ===== CRUD =====

    public ProductListing createListing(ProductListing listing) {
        listing.setListedAt(LocalDateTime.now());
        listing.setIsVisible(true);

        String risk = calcRiskLevel(listing.getExpiresAt());
        listing.setRiskLevel(risk);
        listing.setSuggestedDiscount(calcDiscount(risk));

        return repository.save(listing);
    }

    public List<ProductListing> getAllListings() {
        return repository.findAll();
    }

    public Optional<ProductListing> getListingById(Integer id) {
        return repository.findById(id);
    }

    public List<ProductListing> getListingsByVisibility(Boolean isVisible) {
        return repository.findByIsVisible(isVisible);
    }

    public List<ProductListing> searchListings(String keyword) {
        return repository.findByTitleContainingIgnoreCase(keyword);
    }

    public List<ProductListing> getListingsByFarmer(Integer farmerId) {
        return repository.findByFarmerId(farmerId);
    }

    public List<ProductListing> getListingsByCategory(String category) {
        return repository.findByCategoryIgnoreCase(category);
    }

    public List<ProductListing> getHighRiskListings() {
        return repository.findAll().stream()
                .filter(l -> "HIGH".equals(l.getRiskLevel()))
                .collect(Collectors.toList());
    }

    public List<ProductListing> getListingsSortedByRisk() {
        return repository.findAll().stream()
                .sorted(Comparator.comparingInt(l -> -getRiskScore(l.getRiskLevel())))
                .collect(Collectors.toList());
    }

    public ProductListing updateVisibility(Integer id, Boolean isVisible) {
        ProductListing listing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + id));
        listing.setIsVisible(isVisible);
        return repository.save(listing);
    }

    public ProductListing updateListing(Integer id, ProductListing updated) {
        ProductListing listing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + id));
        listing.setTitle(updated.getTitle());
        listing.setDescription(updated.getDescription());
        listing.setIsVisible(updated.getIsVisible());
        listing.setExpiresAt(updated.getExpiresAt());
        listing.setPricePerKg(updated.getPricePerKg());
        listing.setQuantityKg(updated.getQuantityKg());
        listing.setCategory(updated.getCategory());
        listing.setAvailabilityStatus(updated.getAvailabilityStatus());

        // Recalculate risk & discount on update
        String risk = calcRiskLevel(listing.getExpiresAt());
        listing.setRiskLevel(risk);
        listing.setSuggestedDiscount(calcDiscount(risk));

        return repository.save(listing);
    }

    @Transactional
    public String removeExpiredListings() {
        List<ProductListing> expired = repository.findExpiredListings(LocalDateTime.now());
        int count = expired.size();
        repository.deleteExpiredListings(LocalDateTime.now());
        return count + " expired listing(s) removed.";
    }

    public void deleteListing(Integer id) {
        repository.deleteById(id);
    }

    @Transactional
    public String recalculateAllDiscounts() {
        List<ProductListing> listings = repository.findAll();
        int count = 0;
        for (ProductListing listing : listings) {
            String risk = calcRiskLevel(listing.getExpiresAt());
            int newDiscount = calcDiscount(risk);
            if (!risk.equals(listing.getRiskLevel()) || !Integer.valueOf(newDiscount).equals(listing.getSuggestedDiscount())) {
                listing.setRiskLevel(risk);
                listing.setSuggestedDiscount(newDiscount);
                repository.save(listing);
                count++;
            }
        }
        return count + " listings updated.";
    }
}
