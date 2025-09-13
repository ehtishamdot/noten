"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patientData } from "../lib/patientData";

export default function CoverageConfirmation() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    insuranceProvider: "",
    memberId: "",
    coverageType: "Physical Therapy",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState<string[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [coverageData, setCoverageData] = useState<any>(null);

  // 20 most common insurance providers
  const insuranceProviders = [
    "Aetna",
    "Anthem Blue Cross Blue Shield",
    "Blue Cross Blue Shield",
    "Cigna",
    "UnitedHealthcare",
    "Humana",
    "Kaiser Permanente",
    "Molina Healthcare",
    "Centene Corporation",
    "WellCare",
    "Independence Blue Cross",
    "Highmark",
    "HCSC (Health Care Service Corporation)",
    "Caresource",
    "Medicaid",
    "Medicare",
    "Tricare",
    "Emblem Health",
    "Oscar Health",
    "Bright Health",
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    if (field === "insuranceProvider") {
      if (value.length > 0) {
        const filtered = insuranceProviders.filter((provider) =>
          provider.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProviders(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleProviderSelect = (provider: string) => {
    setFormData({ ...formData, insuranceProvider: provider });
    setShowSuggestions(false);
  };

  const handlePatientAutoFill = (patientId: string) => {
    const patient = patientData[patientId as keyof typeof patientData];
    if (patient) {
      const [firstName, ...lastNameParts] = patient.Name.split(" ");
      const lastName = lastNameParts.join(" ");

      setFormData({
        firstName,
        lastName,
        insuranceProvider: patient.InsuranceProvider || "",
        memberId: generateMemberId(patientId),
        coverageType: "Physical Therapy",
      });
    }
    setShowPatientDropdown(false);
  };

  const generateMemberId = (patientId: string) => {
    // Generate realistic member IDs based on patient
    const memberIds: { [key: string]: string } = {
      "john-doe": "AET123456789",
      "emily-smith": "BCBS987654321",
      "maria-garcia": "MED555123456",
    };
    return memberIds[patientId] || "INS123456789";
  };

  const patients = Object.entries(patientData).map(([id, data]) => ({
    id,
    name: data.Name,
    age: data.Age,
    gender: data.Gender,
    initials: data.Name.split(" ")
      .map((n) => n[0])
      .join(""),
  }));

  const generateCoverageData = (
    firstName: string,
    lastName: string,
    provider: string,
    memberId: string
  ) => {
    // Generate realistic coverage data based on the patient
    const patientKey = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

    const coverageTemplates: { [key: string]: any } = {
      "john-doe": {
        email: "john.doe@email.com",
        insuranceStatus: "ACTIVE",
        planName: "AETNA_BETTER_HEALTH",
        expiryDate: "12/31/2025",
        memberId: memberId,
        mobile: "+15551234567",
        planType: "Health Maintenance Org...",
        insuranceType: "Commercial",
        insuranceName: "Aetna",
        effectiveDate: "01/01/2025",
        therapyCoverage: "Yes",
        remainingVisits: "30/30",
        inNetwork: {
          coInsurancePercent: "20%",
          coPayAmount: "$30.00",
          familyDeductibleRemaining: "$750.00",
          familyDeductibleYear: "$1,500.00",
          familyOutOfPocketRemaining: "$4,250.00",
          familyOutOfPocketYear: "$6,000.00",
          individualDeductibleRemaining: "$500.00",
          individualDeductibleYear: "$750.00",
          individualOutOfPocketRemaining: "$2,800.00",
          individualOutOfPocketYear: "$3,000.00",
        },
        outOfNetwork: {
          coInsurancePercent: "40%",
          coPayAmount: "N/A",
          familyDeductibleRemaining: "$2,100.00",
          familyDeductibleYear: "$3,000.00",
          familyOutOfPocketRemaining: "$8,400.00",
          familyOutOfPocketYear: "$12,000.00",
          individualDeductibleRemaining: "$1,200.00",
          individualDeductibleYear: "$1,500.00",
          individualOutOfPocketRemaining: "$5,200.00",
          individualOutOfPocketYear: "$6,000.00",
        },
      },
      "emily-smith": {
        email: "emily.smith@email.com",
        insuranceStatus: "ACTIVE",
        planName: "BCBS_SILVER_PLAN",
        expiryDate: "12/31/2025",
        memberId: memberId,
        mobile: "+15559876543",
        planType: "Preferred Provider Org...",
        insuranceType: "Commercial",
        insuranceName: "Blue Cross Blue Shield",
        effectiveDate: "01/01/2025",
        therapyCoverage: "Yes",
        remainingVisits: "16/16",
        inNetwork: {
          coInsurancePercent: "30%",
          coPayAmount: "$25.00",
          familyDeductibleRemaining: "$425.75",
          familyDeductibleYear: "$2,000.00",
          familyOutOfPocketRemaining: "$6,150.25",
          familyOutOfPocketYear: "$8,500.00",
          individualDeductibleRemaining: "$325.75",
          individualDeductibleYear: "$1,000.00",
          individualOutOfPocketRemaining: "$3,675.50",
          individualOutOfPocketYear: "$4,250.00",
        },
        outOfNetwork: {
          coInsurancePercent: "60%",
          coPayAmount: "N/A",
          familyDeductibleRemaining: "$1,575.25",
          familyDeductibleYear: "$4,000.00",
          familyOutOfPocketRemaining: "$12,150.75",
          familyOutOfPocketYear: "$17,000.00",
          individualDeductibleRemaining: "$1,175.25",
          individualDeductibleYear: "$2,000.00",
          individualOutOfPocketRemaining: "$7,325.50",
          individualOutOfPocketYear: "$8,500.00",
        },
      },
      "maria-garcia": {
        email: "maria.garcia@email.com",
        insuranceStatus: "ACTIVE",
        planName: "MEDI_CAL_MANAGED",
        expiryDate: "12/31/2025",
        memberId: memberId,
        mobile: "+15555678901",
        planType: "Medicaid Managed Care",
        insuranceType: "Medicaid",
        insuranceName: "Medi-Cal",
        effectiveDate: "01/01/2025",
        therapyCoverage: "Yes",
        remainingVisits: "24/24",
        inNetwork: {
          coInsurancePercent: "0%",
          coPayAmount: "$0.00",
          familyDeductibleRemaining: "$0.00",
          familyDeductibleYear: "$0.00",
          familyOutOfPocketRemaining: "$0.00",
          familyOutOfPocketYear: "$0.00",
          individualDeductibleRemaining: "$0.00",
          individualDeductibleYear: "$0.00",
          individualOutOfPocketRemaining: "$0.00",
          individualOutOfPocketYear: "$0.00",
        },
        outOfNetwork: {
          coInsurancePercent: "N/A",
          coPayAmount: "N/A",
          familyDeductibleRemaining: "N/A",
          familyDeductibleYear: "N/A",
          familyOutOfPocketRemaining: "N/A",
          familyOutOfPocketYear: "N/A",
          individualDeductibleRemaining: "N/A",
          individualDeductibleYear: "N/A",
          individualOutOfPocketRemaining: "N/A",
          individualOutOfPocketYear: "N/A",
        },
      },
    };

    return coverageTemplates[patientKey] || coverageTemplates["john-doe"];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.firstName &&
      formData.lastName &&
      formData.insuranceProvider &&
      formData.memberId &&
      formData.coverageType
    ) {
      setIsLoading(true);

      // Generate coverage data
      const coverage = generateCoverageData(
        formData.firstName,
        formData.lastName,
        formData.insuranceProvider,
        formData.memberId
      );

      // Show loading for 3 seconds
      setTimeout(() => {
        setCoverageData(coverage);
        setIsLoading(false);
        setShowResults(true);
      }, 3000);
    } else {
      alert("Please fill in all fields.");
    }
  };

  if (showResults && coverageData) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setShowResults(false);
                  setCoverageData(null);
                }}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Form
              </button>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                ✅
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Coverage Verified
              </h1>
              <div className="w-20 h-1 bg-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Insurance coverage details for {formData.firstName}{" "}
                {formData.lastName}
              </p>
            </div>
          </div>

          {/* Coverage Results */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Header Information - Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Email ID:</span>
                  <span className="text-gray-900">{coverageData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    Insurance Status:
                  </span>
                  <span className="text-gray-900 font-semibold text-green-600">
                    {coverageData.insuranceStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Plan Name:</span>
                  <span className="text-gray-900">{coverageData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    Expiry Date:
                  </span>
                  <span className="text-gray-900">
                    {coverageData.expiryDate}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Member Id:</span>
                  <span className="text-gray-900">{coverageData.memberId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Mobile:</span>
                  <span className="text-gray-900">{coverageData.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Plan Type:</span>
                  <span className="text-gray-900">{coverageData.planType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    Insurance Type:
                  </span>
                  <span className="text-gray-900">
                    {coverageData.insuranceType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    Insurance Name:
                  </span>
                  <span className="text-gray-900">
                    {coverageData.insuranceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    Effective Date:
                  </span>
                  <span className="text-gray-900">
                    {coverageData.effectiveDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Therapy Coverage Row */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="space-y-2">
                <div className="text-lg font-bold text-gray-900">
                  Therapy Coverage:{" "}
                  <span className="text-green-600">
                    {coverageData.therapyCoverage}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  Remaining Visits Covered:{" "}
                  <span className="text-blue-600">
                    {coverageData.remainingVisits}
                  </span>
                </div>
              </div>
            </div>

            {/* Coverage Details Table */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div></div>
                <div className="text-center font-bold text-gray-900">
                  In Network
                </div>
                <div className="text-center font-bold text-gray-900">
                  Out of Network
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Co insurance percent
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.coInsurancePercent}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.coInsurancePercent}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Co pay amount is
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.coPayAmount}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.coPayAmount}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Family Deductible Remaining
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.familyDeductibleRemaining}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.familyDeductibleRemaining}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Family Deductible Year
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.familyDeductibleYear}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.familyDeductibleYear}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Family out of pocket per year remaining
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.familyOutOfPocketRemaining}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.familyOutOfPocketRemaining}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Family out of pocket per year
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.familyOutOfPocketYear}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.familyOutOfPocketYear}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Individual Deductible Remaining
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.individualDeductibleRemaining}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.individualDeductibleRemaining}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Individual Deductible Year
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.individualDeductibleYear}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.individualDeductibleYear}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700">
                    Individual out of pocket per year remaining
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.individualOutOfPocketRemaining}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.individualOutOfPocketRemaining}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <div className="font-medium text-gray-700">
                    Individual out of pocket per year
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.inNetwork.individualOutOfPocketYear}
                  </div>
                  <div className="text-right text-gray-900">
                    {coverageData.outOfNetwork.individualOutOfPocketYear}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Loading Modal */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying Coverage
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  Checking insurance details and benefits...
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Apps
            </button>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🔍
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Coverage Confirmation
            </h1>
            <div className="w-20 h-1 bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Enter patient insurance information to verify coverage
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Auto-complete Button */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Quick fill with demo patient
              </button>

              {/* Patient Dropdown */}
              {showPatientDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                      Select a demo patient:
                    </div>
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientAutoFill(patient.id)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md transition-colors flex items-center"
                      >
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                          {patient.initials}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {patient.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.gender}, {patient.age} years old
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter first name"
                  onClick={() => setShowPatientDropdown(false)}
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter last name"
                  onClick={() => setShowPatientDropdown(false)}
                  required
                />
              </div>
            </div>

            {/* Insurance Provider */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Provider *
              </label>
              <input
                type="text"
                value={formData.insuranceProvider}
                onChange={(e) =>
                  handleInputChange("insuranceProvider", e.target.value)
                }
                onFocus={() => {
                  if (formData.insuranceProvider.length > 0) {
                    const filtered = insuranceProviders.filter((provider) =>
                      provider
                        .toLowerCase()
                        .includes(formData.insuranceProvider.toLowerCase())
                    );
                    setFilteredProviders(filtered);
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow for clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onClick={() => {
                  // Close patient dropdown when focusing on insurance field
                  setShowPatientDropdown(false);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Start typing insurance provider name..."
                required
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredProviders.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProviders.map((provider, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleProviderSelect(provider)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {provider}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Member ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member ID *
              </label>
              <input
                type="text"
                value={formData.memberId}
                onChange={(e) => handleInputChange("memberId", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter member ID"
                onClick={() => setShowPatientDropdown(false)}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                This is typically found on your insurance card
              </p>
            </div>

            {/* Type of Coverage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Coverage *
              </label>
              <select
                value={formData.coverageType}
                onChange={(e) =>
                  handleInputChange("coverageType", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                onClick={() => setShowPatientDropdown(false)}
                required
              >
                <option value="Physical Therapy">Physical Therapy</option>
                <option value="Occupational Therapy">
                  Occupational Therapy
                </option>
                <option value="Chiropractic Services">
                  Chiropractic Services
                </option>
                <option value="Home Health Benefits">
                  Home Health Benefits
                </option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Select the type of therapy coverage to verify
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Verify Coverage
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">
                What happens next?
              </h3>
              <div className="mt-2 text-sm text-blue-800">
                <p>
                  We'll verify the patient's insurance coverage and provide
                  detailed information about:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Coverage status and eligibility</li>
                  <li>Deductible and copayment information</li>
                  <li>Physical therapy benefits and limitations</li>
                  <li>Prior authorization requirements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
