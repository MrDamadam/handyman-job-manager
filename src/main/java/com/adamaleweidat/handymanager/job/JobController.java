package com.adamaleweidat.handymanager.job;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping("/{id}")
    public Job getJob(@PathVariable Long id) {
        return jobService.getJob(id);
    }

    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    @PostMapping("/customer/{customerId}")
    public ResponseEntity<Job> createJob(@PathVariable Long customerId, @Valid @RequestBody Job job) {
        Job savedJob = jobService.createJob(customerId, job);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedJob);
    }

    @GetMapping("/customer/{customerId}")
    public List<Job> getJobsByCustomer(@PathVariable Long customerId) {
        return jobService.getJobsByCustomer(customerId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> updateJob(@PathVariable Long id, @Valid @RequestBody Job updatedJob) {
        Job savedJob = jobService.updateJob(id, updatedJob);
        return ResponseEntity.ok(savedJob);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Job> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }
}
