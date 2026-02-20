export interface JobSearchParams {
  role: string;
  location: string;
  country: string;
  isRemote: boolean;
  jobTypes: ("vollzeit" | "teilzeit" | "werkstudent" | "praktikum")[];
}

export interface ApiJobResult {
  title: string;
  company: string;
  salaryRange?: string;
  sourceUrl: string;
  description: string;
  location?: string;
  country?: string;
  isRemote?: boolean;
  jobType?: string;
  source: string;
}
