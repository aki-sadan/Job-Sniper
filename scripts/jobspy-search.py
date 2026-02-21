#!/usr/bin/env python3
"""
JobSpy-Brücke für Career Sniper.
Nimmt Base64-JSON als CLI-Argument, ruft python-jobspy auf und gibt JSON-Array zurück.

Verwendung:
  python3 scripts/jobspy-search.py <base64-encoded-json>

Input-JSON:
  {
    "role": "AI Engineer",
    "location": "Frankfurt",
    "country": "Deutschland",
    "isRemote": false,
    "jobTypes": ["vollzeit"]
  }

Output: JSON-Array im ApiJobResult-Format auf stdout.
Fehler: JSON-Objekt mit "error" auf stderr.
"""

import sys
import json
import base64

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Kein Argument übergeben"}), file=sys.stderr)
        print("[]")
        return

    try:
        params_json = base64.b64decode(sys.argv[1]).decode("utf-8")
        params = json.loads(params_json)
    except Exception as e:
        print(json.dumps({"error": f"Parameter-Dekodierung fehlgeschlagen: {str(e)}"}), file=sys.stderr)
        print("[]")
        return

    try:
        from jobspy import scrape_jobs
    except ImportError:
        print(json.dumps({"error": "python-jobspy nicht installiert. Installiere mit: pip3 install python-jobspy"}), file=sys.stderr)
        print("[]")
        return

    role = params.get("role", "")
    location = params.get("location", "")
    country = params.get("country", "Deutschland")
    is_remote = params.get("isRemote", False)
    job_types = params.get("jobTypes", ["vollzeit"])

    # Jobtypen-Mapping: Deutsch -> Englisch für JobSpy
    job_type_map = {
        "vollzeit": "fulltime",
        "teilzeit": "parttime",
        "werkstudent": "internship",
        "praktikum": "internship",
    }

    # Länder-Mapping für country_indeed
    country_map = {
        "Deutschland": "germany",
        "Österreich": "austria",
        "Schweiz": "switzerland",
        "Niederlande": "netherlands",
        "Belgien": "belgium",
        "Frankreich": "france",
    }

    # Ersten Jobtyp für JobSpy verwenden (unterstützt nur einen)
    mapped_job_type = None
    if job_types:
        mapped_job_type = job_type_map.get(job_types[0])

    country_indeed = country_map.get(country, "germany")

    # Suchort zusammenbauen
    search_location = location if location and not is_remote else country

    try:
        # Sites für die Suche
        site_names = ["linkedin", "indeed", "google"]

        scrape_params = {
            "site_name": site_names,
            "search_term": role,
            "location": search_location,
            "results_wanted": 15,
            "country_indeed": country_indeed,
            "is_remote": is_remote,
        }

        if mapped_job_type:
            scrape_params["job_type"] = mapped_job_type

        jobs_df = scrape_jobs(**scrape_params)

        if jobs_df is None or jobs_df.empty:
            print("[]")
            return

        results = []
        for _, row in jobs_df.iterrows():
            # Source-Name für Career Sniper
            site = str(row.get("site", "")).lower()
            source_name = f"jobspy-{site}" if site else "jobspy"

            # URL sicherstellen
            job_url = str(row.get("job_url", ""))
            if not job_url or job_url == "nan":
                continue

            # Beschreibung
            description = str(row.get("description", ""))
            if description == "nan":
                description = ""
            # Beschreibung kürzen auf 2000 Zeichen
            if len(description) > 2000:
                description = description[:2000] + "..."

            # Gehalt
            salary_min = row.get("min_amount")
            salary_max = row.get("max_amount")
            salary_currency = row.get("currency", "EUR")
            salary_range = None
            if salary_min and str(salary_min) != "nan":
                if salary_max and str(salary_max) != "nan":
                    salary_range = f"{int(float(salary_min)):,} - {int(float(salary_max)):,} {salary_currency}".replace(",", ".")
                else:
                    salary_range = f"ab {int(float(salary_min)):,} {salary_currency}".replace(",", ".")

            # Standort
            job_location = str(row.get("location", ""))
            if job_location == "nan":
                job_location = ""

            # Remote
            job_is_remote = bool(row.get("is_remote", False))
            if is_remote:
                job_is_remote = True

            # Titel und Firma
            title = str(row.get("title", "Unbekannte Position"))
            company_name = str(row.get("company_name", "Unbekanntes Unternehmen"))
            if title == "nan":
                title = "Unbekannte Position"
            if company_name == "nan":
                company_name = "Unbekanntes Unternehmen"

            # Jobtyp zurückmappen
            job_type_value = job_types[0] if job_types else "vollzeit"

            result = {
                "title": title,
                "company": company_name,
                "salaryRange": salary_range,
                "sourceUrl": job_url,
                "description": description[:2000] if description else f"Position als {title} bei {company_name}",
                "location": job_location,
                "country": country,
                "isRemote": job_is_remote,
                "jobType": job_type_value,
                "source": source_name,
            }
            results.append(result)

        print(json.dumps(results, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": f"JobSpy-Suche fehlgeschlagen: {str(e)}"}), file=sys.stderr)
        print("[]")
        return


if __name__ == "__main__":
    main()
