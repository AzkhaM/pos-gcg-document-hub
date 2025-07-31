import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  FileText, 
  Upload, 
  Edit3, 
  Plus, 
  Minus, 
  Save, 
  Calendar,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  LineChart
} from 'lucide-react';

interface PenilaianRow {
  id: string;
  aspek: string;
  deskripsi: string;
  jumlah_parameter: number;
  bobot: number;
  skor: number;
  capaian: number;
  penjelasan: string;
}

const PenilaianGCG = () => {
  const { isSidebarOpen } = useSidebar();
  
  // State untuk workflow
  const [currentStep, setCurrentStep] = useState<'method' | 'table' | 'upload'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'manual' | 'otomatis' | null>(null);
  
  // State untuk tahun
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customYear, setCustomYear] = useState('');
  const [showAddYear, setShowAddYear] = useState(false);
  const [customYears, setCustomYears] = useState<number[]>([]);
  
  // State untuk data table
  const [tableData, setTableData] = useState<PenilaianRow[]>([]);
  const [editingCell, setEditingCell] = useState<{rowId: string, field: keyof PenilaianRow} | null>(null);
  
  // State untuk file upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Generate tahun dari 2014 sampai sekarang + 2 tahun ke depan + custom years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const baseYears = [];
    for (let year = currentYear + 2; year >= 2014; year--) {
      baseYears.push(year);
    }
    
    // Combine base years with custom years and sort
    const allYears = [...baseYears, ...customYears];
    return [...new Set(allYears)].sort((a, b) => b - a);
  }, [customYears]);

  // Auto-calculate capaian dan penjelasan
  const calculateCapaian = (skor: number, bobot: number): number => {
    if (bobot === 0) return 0;
    return Math.round((skor / bobot) * 100);
  };

  const getPenjelasan = (capaian: number): string => {
    if (capaian >= 90) return 'Sangat Baik';
    if (capaian >= 80) return 'Baik';
    if (capaian >= 70) return 'Cukup Baik';
    if (capaian >= 60) return 'Kurang Baik';
    return 'Sangat Kurang';
  };

  // Add new row to table
  const addNewRow = () => {
    const newRow: PenilaianRow = {
      id: Date.now().toString(),
      aspek: '',
      deskripsi: '',
      jumlah_parameter: 0,
      bobot: 0,
      skor: 0,
      capaian: 0,
      penjelasan: 'Sangat Kurang'
    };
    setTableData([...tableData, newRow]);
  };

  // Delete row from table
  const deleteRow = (rowId: string) => {
    setTableData(tableData.filter(row => row.id !== rowId));
  };

  // Update cell value
  const updateCell = (rowId: string, field: keyof PenilaianRow, value: any) => {
    setTableData(tableData.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-calculate capaian dan penjelasan jika skor atau bobot berubah
        if (field === 'skor' || field === 'bobot') {
          updatedRow.capaian = calculateCapaian(updatedRow.skor, updatedRow.bobot);
          updatedRow.penjelasan = getPenjelasan(updatedRow.capaian);
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  // Handle add custom year
  const handleAddYear = () => {
    const year = parseInt(customYear);
    if (year && year >= 2000 && year <= 2050 && !years.includes(year)) {
      setCustomYears([...customYears, year]);
      setSelectedYear(year);
      setCustomYear('');
      setShowAddYear(false);
    }
  };

  // Handle file upload for otomatis method
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Call POS Data Cleaner backend (assuming you have an API endpoint)
      // For now, we'll use the Python script directly via subprocess
      // In production, you should set up a proper REST API
      
      // Temporary: Save file to temp location and process
      const tempFileName = `temp_${Date.now()}_${file.name}`;
      const outputFileName = `output_${Date.now()}.xlsx`;
      
      // Note: This is a temporary solution. In production, implement proper file upload API
      const response = await fetch('/api/process-gcg', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();
      
      // Convert result to PenilaianRow format
      const processedData: PenilaianRow[] = result.data.map((row: any, index: number) => ({
        id: (index + 1).toString(),
        aspek: row.Section || row.aspek || '',
        deskripsi: row.Deskripsi || row.deskripsi || '',
        jumlah_parameter: row.Jumlah_Parameter || row.jumlah_parameter || 0,
        bobot: row.Bobot || row.bobot || 0,
        skor: row.Skor || row.skor || 0,
        capaian: row.Capaian || row.capaian || 0,
        penjelasan: row.Penjelasan || row.penjelasan || ''
      }));
      
      setTableData(processedData);
      setCurrentStep('table');
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError('Gagal memproses file. Silakan periksa format file atau coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Method Selection Step
  const renderMethodSelection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Penilaian GCG
            </h1>
            <p className="text-gray-600 mt-1">
              Pilih metode input data penilaian Good Corporate Governance
            </p>
          </div>
        </div>
      </div>

      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Input Manual */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-gray-200 hover:border-green-300"
          onClick={() => {
            setSelectedMethod('manual');
            setCurrentStep('table');
          }}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Edit3 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-green-700">Input Manual</CardTitle>
            <CardDescription className="text-gray-600">
              Input data penilaian GCG secara manual satu per satu
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Kontrol penuh atas data</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Edit langsung di tabel</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Tambah baris sesuai kebutuhan</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Otomatis */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-gray-200 hover:border-purple-300"
          onClick={() => {
            setSelectedMethod('otomatis');
            setCurrentStep('upload');
          }}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-purple-700">Input Otomatis</CardTitle>
            <CardDescription className="text-gray-600">
              Upload file dokumen untuk diproses otomatis
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span>Support Excel, PDF, Gambar</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span>Akurasi 98.9% (Excel)</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span>Dapat di-review dan edit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Dashboard */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-gray-200 hover:border-blue-300"
          onClick={() => {
            alert('Dashboard sedang dalam pengembangan (work in progress)');
          }}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
              <LineChart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-blue-700">Lihat Dashboard</CardTitle>
            <CardDescription className="text-gray-600">
              Lihat dashboard dan analisis data GCG
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Visualisasi data interaktif</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Analisis tren dan performa</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Export laporan otomatis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );

  // File Upload Step
  const renderFileUpload = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('method')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload File Dokumen</h2>
          <p className="text-gray-600">Upload file GCG untuk diproses otomatis</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drag & Drop atau Klik untuk Upload</h3>
            <p className="text-gray-600 mb-4">
              Support: Excel (.xlsx, .xls), PDF, Gambar (.png, .jpg)
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Maksimal ukuran file: 50MB
            </p>
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <Label htmlFor="file-upload">
              <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Pilih File
                </span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h4 className="font-semibold text-blue-900">Memproses File...</h4>
                <p className="text-blue-700 text-sm">
                  Menggunakan POS Data Cleaner untuk mengekstrak data GCG
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {processingError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Gagal Memproses File</h4>
                <p className="text-red-700 text-sm mt-1">{processingError}</p>
                <div className="mt-3 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentStep('method')}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Coba Input Manual
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setProcessingError(null);
                      setUploadedFile(null);
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Upload File Lain
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Table Step (main editing interface)
  const renderTable = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('method')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedMethod === 'manual' ? 'Input Manual' : 'Review & Edit'} Data GCG
            </h2>
            <p className="text-gray-600">
              {selectedMethod === 'manual' 
                ? 'Tambahkan data penilaian GCG secara manual'
                : 'Review hasil otomatis dan edit jika diperlukan'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Year Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Tahun Buku Penilaian</span>
          </CardTitle>
          <CardDescription>
            Pilih tahun buku untuk data penilaian GCG ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun buku" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {showAddYear ? (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="2026"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  className="w-20"
                />
                <Button size="sm" onClick={handleAddYear}>
                  <CheckCircle className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddYear(false);
                    setCustomYear('');
                  }}
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddYear(true)}
                className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-3 h-3 mr-1" />
                Tambah Tahun Buku
              </Button>
            )}
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tahun Buku Terpilih: {selectedYear}</strong> - Semua data akan disimpan untuk tahun buku ini
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Data Penilaian GCG - Tahun Buku {selectedYear}</span>
              </CardTitle>
              <CardDescription>
                {tableData.length} baris data penilaian
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Button 
                onClick={addNewRow}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Baris
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={tableData.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <TableHead className="text-indigo-900 font-semibold">Aspek</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Deskripsi</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Jumlah Parameter</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Bobot</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Skor</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Capaian (%)</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Penjelasan</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">
                    {/* Aspek */}
                    <TableCell>
                      <Input
                        value={row.aspek}
                        onChange={(e) => updateCell(row.id, 'aspek', e.target.value)}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300"
                        placeholder="I, II, III..."
                      />
                    </TableCell>
                    
                    {/* Deskripsi */}
                    <TableCell className="min-w-64">
                      <Input
                        value={row.deskripsi}
                        onChange={(e) => updateCell(row.id, 'deskripsi', e.target.value)}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300"
                        placeholder="Deskripsi penilaian..."
                      />
                    </TableCell>
                    
                    {/* Jumlah Parameter */}
                    <TableCell>
                      <Input
                        type="number"
                        value={row.jumlah_parameter}
                        onChange={(e) => updateCell(row.id, 'jumlah_parameter', parseInt(e.target.value) || 0)}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                      />
                    </TableCell>
                    
                    {/* Bobot */}
                    <TableCell>
                      <Input
                        type="number"
                        value={row.bobot}
                        onChange={(e) => updateCell(row.id, 'bobot', parseFloat(e.target.value) || 0)}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                      />
                    </TableCell>
                    
                    {/* Skor */}
                    <TableCell>
                      <Input
                        type="number"
                        value={row.skor}
                        onChange={(e) => updateCell(row.id, 'skor', parseFloat(e.target.value) || 0)}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                      />
                    </TableCell>
                    
                    {/* Capaian (Auto-calculated) */}
                    <TableCell>
                      <div className="text-center font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          row.capaian >= 90 ? 'bg-green-100 text-green-800' :
                          row.capaian >= 80 ? 'bg-blue-100 text-blue-800' :
                          row.capaian >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          row.capaian >= 60 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.capaian}%
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Penjelasan (Auto-calculated) */}
                    <TableCell>
                      <div className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.penjelasan === 'Sangat Baik' ? 'bg-green-100 text-green-800' :
                          row.penjelasan === 'Baik' ? 'bg-blue-100 text-blue-800' :
                          row.penjelasan === 'Cukup Baik' ? 'bg-yellow-100 text-yellow-800' :
                          row.penjelasan === 'Kurang Baik' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.penjelasan}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Action */}
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRow(row.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Add Row Button at Bottom of Table */}
            {tableData.length > 0 && (
              <div className="mt-4 text-center">
                <Button 
                  onClick={addNewRow}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Baris
                </Button>
              </div>
            )}
            
            {tableData.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Belum ada data penilaian
                </h3>
                <p className="text-gray-500 mb-4">
                  Klik "Tambah Baris" untuk mulai menambahkan data penilaian GCG
                </p>
                <Button 
                  onClick={addNewRow}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Baris Pertama
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <Topbar />
      
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {currentStep === 'method' && renderMethodSelection()}
          {currentStep === 'upload' && renderFileUpload()}
          {currentStep === 'table' && renderTable()}
        </div>
      </div>
    </div>
  );
};

export default PenilaianGCG;