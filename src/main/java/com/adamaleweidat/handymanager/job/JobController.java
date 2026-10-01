package com.adamaleweidat.handymanager.job;

import com.adamaleweidat.handymanager.dto.JobResponse;
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
    public JobResponse getJob(@PathVariable Long id) {
        Job job = jobService.getJob(id);
        return new JobResponse(job);
    }

    @GetMapping
    public List<JobResponse> getAllJobs() {
        return jobService.getAllJobs().stream().map(JobResponse::new).toList();
    }

    @PostMapping("/customer/{customerId}")
    public ResponseEntity<JobResponse> createJob(@PathVariable Long customerId, @Valid @RequestBody Job job) {
        Job savedJob = jobService.createJob(customerId, job);
        return ResponseEntity.status(HttpStatus.CREATED).body(new JobResponse(savedJob));
    }

    @GetMapping("/customer/{customerId}")
    public List<JobResponse> getJobsByCustomer(@PathVariable Long customerId) {
        return jobService.getJobsByCustomer(customerId).stream().map(JobResponse::new).toList();
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> updateJob(@PathVariable Long id, @Valid @RequestBody Job updatedJob) {
        Job savedJob = jobService.updateJob(id, updatedJob);
        return ResponseEntity.ok(new JobResponse(savedJob));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }
}
