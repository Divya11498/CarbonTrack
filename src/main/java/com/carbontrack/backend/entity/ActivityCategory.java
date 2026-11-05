package com.carbontrack.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "activity_categories")
public class ActivityCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    public ActivityCategory() {
    }

    public Short getId() {
        return id;
    }

    public void setId(Short id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
