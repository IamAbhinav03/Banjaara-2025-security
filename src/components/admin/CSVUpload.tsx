import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadCSVData } from "@/services/firebase";
import { ExternalType } from "@/types";
import Papa from "papaparse";

/**
 * Props for the CSVUpload component
 */
interface CSVUploadProps {
  /** The current logged-in user */
  user: {
    name: string;
    role: string;
  };
}

/**
 * Interface for CSV row data
 */
interface CSVRow {
  name: string;
  email: string;
  phone: string;
  type: ExternalType;
  feePaid: boolean;
}

/**
 * CSVUpload component that handles CSV file uploads for admin users
 *
 * This component allows administrators to upload CSV files containing user data.
 * The CSV should have columns for name, email, phone, type, and feePaid status.
 */
const CSVUpload: React.FC<CSVUploadProps> = ({ user }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  /**
   * Handles the CSV file upload and processing
   * Parses the CSV file and uploads the data to the database
   */
  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first");
      return;
    }

    try {
      const text = await file.text();
      const results = Papa.parse(text, { header: true });
      const rows = results.data.map((row: unknown) => {
        const typedRow = row as Record<string, string>;
        return {
          name: typedRow.name,
          email: typedRow.email,
          phone: typedRow.phone,
          type: typedRow.type as ExternalType,
          feePaid: typedRow.feePaid === "true",
        };
      });

      const uids = await uploadCSVData(rows);
      setStatus(`Successfully uploaded ${uids.length} records`);
    } catch (error) {
      setStatus("Upload failed");
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card className="mb-4 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold mb-2">Upload CSV/Excel</h1>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />
          <Button onClick={handleUpload} className="mb-2">
            Upload
          </Button>
          {status && <p className="text-green-500">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVUpload;
