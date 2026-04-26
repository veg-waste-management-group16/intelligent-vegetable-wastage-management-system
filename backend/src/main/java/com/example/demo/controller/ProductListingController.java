package com.example.demo.controller;

import com.example.demo.model.ProductListing;
import com.example.demo.service.ListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Product Listings — integrated into VegLife backend.
 * Base URL: /api/listings
 * Backend runs on port 8082 (application.properties).
 */
@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*")
public class ProductListingController {

    @Autowired
    private ListingService service;

    // ===== CREATE =====
    @PostMapping
    public ResponseEntity<ProductListing> createListing(@RequestBody ProductListing listing) {
        return ResponseEntity.ok(service.createListing(listing));
    }

    // ===== READ =====
    @GetMapping
    public ResponseEntity<List<ProductListing>> getAllListings() {
        return ResponseEntity.ok(service.getAllListings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductListing> getById(@PathVariable Integer id) {
        return service.getListingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/filter/visible")
    public ResponseEntity<List<ProductListing>> getVisible() {
        return ResponseEntity.ok(service.getListingsByVisibility(true));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductListing>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchListings(keyword));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<ProductListing>> getByFarmer(@PathVariable Integer farmerId) {
        return ResponseEntity.ok(service.getListingsByFarmer(farmerId));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductListing>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(service.getListingsByCategory(category));
    }

    @GetMapping("/risk/high")
    public ResponseEntity<List<ProductListing>> getHighRisk() {
        return ResponseEntity.ok(service.getHighRiskListings());
    }

    @GetMapping("/sorted-by-risk")
    public ResponseEntity<List<ProductListing>> getSortedByRisk() {
        return ResponseEntity.ok(service.getListingsSortedByRisk());
    }

    // ===== UPDATE =====
    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ProductListing> updateVisibility(
            @PathVariable Integer id,
            @RequestParam Boolean isVisible) {
        return ResponseEntity.ok(service.updateVisibility(id, isVisible));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductListing> updateListing(
            @PathVariable Integer id,
            @RequestBody ProductListing listing) {
        return ResponseEntity.ok(service.updateListing(id, listing));
    }

    // ===== DELETE =====
    @DeleteMapping("/expired")
    public ResponseEntity<String> removeExpired() {
        return ResponseEntity.ok(service.removeExpiredListings());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Integer id) {
        service.deleteListing(id);
        return ResponseEntity.noContent().build();
    }

    // ===== ADMIN UTILS =====
    @PostMapping("/admin/recalculate-discounts")
    public ResponseEntity<String> recalculateDiscounts() {
        return ResponseEntity.ok(service.recalculateAllDiscounts());
    }

    @GetMapping("/admin/recalculate-discounts")
    public ResponseEntity<String> recalculateDiscountsGet() {
        return ResponseEntity.ok(service.recalculateAllDiscounts());
    }
}
