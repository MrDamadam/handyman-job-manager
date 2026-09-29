import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job } from '../models/job';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private apiUrl = 'http://localhost:8080/api/jobs';

  constructor(private http: HttpClient) {}

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.apiUrl);
  }

  createJob(customerId: number, job: Partial<Job>): Observable<Job> {
    return this.http.post<Job>(`${this.apiUrl}/customer/${customerId}`, job);
  }

  updateJob(job: Job): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/${job.id}`, job);
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
