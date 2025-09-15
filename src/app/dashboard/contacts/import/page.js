'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function ImportContactsPage() {
  const [importData, setImportData] = useState({
    csvData: '',
    mapping: {
      phoneNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      tags: '',
    },
  });
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      parseCsvData(csv);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      setError('CSV file must have at least a header row and one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const dataRows = lines.slice(1, 6).map(line => 
      line.split(',').map(cell => cell.trim().replace(/['"]/g, ''))
    );

    setCsvHeaders(headers);
    setPreviewData(dataRows);
    setImportData(prev => ({ ...prev, csvData: csvText }));
    setError('');
  };

  const handleTextAreaInput = (e) => {
    const csvText = e.target.value;
    setImportData(prev => ({ ...prev, csvData: csvText }));
    
    if (csvText.trim()) {
      parseCsvData(csvText);
    } else {
      setCsvHeaders([]);
      setPreviewData([]);
    }
  };

  const handleMappingChange = (field, header) => {
    setImportData(prev => ({
      ...prev,
      mapping: { ...prev.mapping, [field]: header }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!importData.csvData.trim()) {
      setError('Please provide CSV data');
      setLoading(false);
      return;
    }

    if (!importData.mapping.phoneNumber) {
      setError('Phone number field mapping is required');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const lines = importData.csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const dataRows = lines.slice(1);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const line of dataRows) {
        const cells = line.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
        
        const contactData = {
          phoneNumber: cells[headers.indexOf(importData.mapping.phoneNumber)] || '',
          firstName: importData.mapping.firstName ? cells[headers.indexOf(importData.mapping.firstName)] || '' : '',
          lastName: importData.mapping.lastName ? cells[headers.indexOf(importData.mapping.lastName)] || '' : '',
          email: importData.mapping.email ? cells[headers.indexOf(importData.mapping.email)] || '' : '',
          tags: importData.mapping.tags ? 
            (cells[headers.indexOf(importData.mapping.tags)] || '').split(';').filter(t => t.trim()) : [],
        };

        if (!contactData.phoneNumber) {
          errorCount++;
          errors.push(`Row ${dataRows.indexOf(line) + 2}: Missing phone number`);
          continue;
        }

        try {
          const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errorCount++;
            errors.push(`Row ${dataRows.indexOf(line) + 2}: ${errorData.error}`);
          }
        } catch (err) {
          errorCount++;
          errors.push(`Row ${dataRows.indexOf(line) + 2}: Network error`);
        }

        // Add small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (successCount > 0) {
        setSuccess(`Successfully imported ${successCount} contacts. ${errorCount} errors.`);
        if (errorCount === 0) {
          setTimeout(() => router.push('/dashboard/contacts'), 2000);
        }
      } else {
        setError('No contacts were imported successfully.');
      }

      if (errors.length > 0 && errors.length <= 10) {
        setError(`${errorCount} errors occurred:\n${errors.join('\n')}`);
      }

    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/contacts"
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Contacts
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
        <p className="mt-1 text-gray-600">
          Upload a CSV file or paste CSV data to import multiple contacts at once.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <pre className="text-red-800 text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Import Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">CSV Import</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500">
            <span className="px-2 bg-white text-sm">or</span>
          </div>

          {/* Manual CSV Input */}
          <div>
            <label htmlFor="csvData" className="block text-sm font-medium text-gray-700">
              Paste CSV Data
            </label>
            <textarea
              id="csvData"
              rows={8}
              value={importData.csvData}
              onChange={handleTextAreaInput}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="firstName,lastName,phoneNumber,email,tags&#10;John,Doe,+1234567890,john@example.com,customer;vip&#10;Jane,Smith,+1987654321,jane@example.com,lead"
            />
            <p className="mt-1 text-sm text-gray-500">
              First row should contain column headers. Separate tags with semicolons.
            </p>
          </div>

          {/* Field Mapping */}
          {csvHeaders.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Map CSV Columns</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number * (Required)
                  </label>
                  <select
                    required
                    value={importData.mapping.phoneNumber}
                    onChange={(e) => handleMappingChange('phoneNumber', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name (Optional)
                  </label>
                  <select
                    value={importData.mapping.firstName}
                    onChange={(e) => handleMappingChange('firstName', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name (Optional)
                  </label>
                  <select
                    value={importData.mapping.lastName}
                    onChange={(e) => handleMappingChange('lastName', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email (Optional)
                  </label>
                  <select
                    value={importData.mapping.email}
                    onChange={(e) => handleMappingChange('email', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tags (Optional)
                  </label>
                  <select
                    value={importData.mapping.tags}
                    onChange={(e) => handleMappingChange('tags', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Tags should be separated by semicolons in the CSV
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-md font-medium text-gray-900">Preview (First 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.map((header) => (
                        <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/contacts"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !importData.csvData.trim() || !importData.mapping.phoneNumber}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import Contacts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
