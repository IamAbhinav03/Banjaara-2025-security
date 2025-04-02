import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadCSVData } from "@/services/firebase";
import Papa from "papaparse";
import { Loader } from "lucide-react";
import { CSVRow, ExternalType } from "@/types";

// Define a type for the raw CSV data
interface RawCSVData {
  ID: string;
  Name: string;
  Email: string;
  Mobile: string;
  Gender?: string;
  College?: string;
  "Payment Status"?: string;
  Events?: string;
  [key: string]: string | undefined;
}

interface CSVUploadProps {
  user: {
    name: string;
    role: string;
  };
}

const CSVUpload: React.FC<CSVUploadProps> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [selectedType, setSelectedType] = useState<ExternalType>("participant");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first");
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      const results = Papa.parse<RawCSVData>(text, { header: true });
      const rows: CSVRow[] = results.data
        .filter((row) => Object.values(row).some((value) => value !== ""))
        .map((row) => ({
          bid: row.ID || "",
          name: row.Name || "",
          email: row.Email || "",
          phone: row.Mobile || "",
          type: selectedType,
          paymentStatus: row["Payment Status"] || "not paid",
          events: (row.Events || "").split(",").map((event) => event.trim()),
        }));

      console.log(rows);
      const successCount = await uploadCSVData(rows);
      setStatus(`Successfully uploaded ${successCount} records`);
    } catch (error) {
      setStatus("Upload failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="mb-4 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold mb-2">Upload CSV/Excel</h1>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2 w-full p-2 border rounded"
          />
          <select
            onChange={(e) => setSelectedType(e.target.value as ExternalType)}
            className="mb-2 w-full p-2 border rounded"
            defaultValue="participant"
          >
            <option value="participant">Participant</option>
            <option value="attendee">Attendee</option>
            <option value="on-the-spot">On-the-Spot</option>
          </select>
          <Button
            onClick={handleUpload}
            className="w-full p-2 flex justify-center items-center"
          >
            {loading ? <Loader className="animate-spin" /> : "Upload"}
          </Button>
          {status && <p className="mt-2 text-green-500">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVUpload;
