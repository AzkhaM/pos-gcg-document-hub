import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  Target,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { useAOI, AOI } from '@/contexts/AOIContext';
import { useYear } from '@/contexts/YearContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { YearSelectorPanel, PageHeaderPanel } from '@/components/panels';

const AOIDashboard = () => {
  const { selectedYear, setSelectedYear } = useYear();
  const { isSidebarOpen } = useSidebar();
  const { 
    aois, 
    getAOIsByYear, 
    getAOIStats, 
    addAOI, 
    updateAOI, 
    deleteAOI,
    updateAOIProgress 
  } = useAOI();

  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAspect, setSelectedAspect] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get AOIs for selected year
  const yearAOIs = useMemo(() => getAOIsByYear(selectedYear), [getAOIsByYear, selectedYear]);
  
  // Get statistics
  const stats = useMemo(() => getAOIStats(selectedYear), [getAOIStats, selectedYear]);

  // Filter AOIs
  const filteredAOIs = useMemo(() => {
    let filtered = yearAOIs;

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(aoi => aoi.priority === selectedPriority);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(aoi => aoi.status === selectedStatus);
    }

    if (selectedAspect !== 'all') {
      filtered = filtered.filter(aoi => aoi.aspect === selectedAspect);
    }

    if (searchTerm) {
      filtered = filtered.filter(aoi => 
        aoi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aoi.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aoi.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [yearAOIs, selectedPriority, selectedStatus, selectedAspect, searchTerm]);

  // Get unique aspects for filter
  const aspects = useMemo(() => {
    return [...new Set(yearAOIs.map(aoi => aoi.aspect))];
  }, [yearAOIs]);

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status icons
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <TrendingUp className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (yearAOIs.length === 0) return 0;
    const totalProgress = yearAOIs.reduce((sum, aoi) => sum + aoi.progress, 0);
    return Math.round(totalProgress / yearAOIs.length);
  }, [yearAOIs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <Topbar />
      
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <PageHeaderPanel
            title="AOI Dashboard"
            subtitle="Area of Improvement - Monitoring dan pengelolaan area yang perlu diperbaiki"
            badge={{ text: selectedYear.toString(), variant: "default" }}
            actions={[
              {
                label: "Tambah AOI",
                onClick: () => {/* TODO: Open add AOI dialog */},
                icon: <Plus className="w-4 h-4" />
              }
            ]}
          />

          {/* Year Selection */}
          <YearSelectorPanel
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={[2024, 2025]}
            title="Tahun Buku"
            description="Pilih tahun buku untuk melihat AOI"
          />

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total AOI */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Total AOI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-blue-100 text-sm">Area yang perlu diperbaiki</div>
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Progress Keseluruhan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallProgress}%</div>
                <Progress value={overallProgress} className="mt-2 bg-green-400" />
              </CardContent>
            </Card>

            {/* Completed */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Selesai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completed}</div>
                <div className="text-emerald-100 text-sm">AOI yang telah selesai</div>
              </CardContent>
            </Card>

            {/* Critical */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Kritis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.critical}</div>
                <div className="text-red-100 text-sm">Prioritas tertinggi</div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Overview */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-red-600" />
                <span>Overview Prioritas</span>
              </CardTitle>
              <CardDescription>
                Distribusi AOI berdasarkan tingkat prioritas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Critical */}
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                  <div className="text-sm text-red-700">Kritis</div>
                  <div className="text-xs text-red-600 mt-1">Prioritas Tertinggi</div>
                </div>

                {/* High */}
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
                  <div className="text-sm text-orange-700">Tinggi</div>
                  <div className="text-xs text-orange-600 mt-1">Perlu Perhatian</div>
                </div>

                {/* Medium */}
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                  <div className="text-sm text-yellow-700">Sedang</div>
                  <div className="text-xs text-yellow-600 mt-1">Perencanaan</div>
                </div>

                {/* Low */}
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{stats.low}</div>
                  <div className="text-sm text-green-700">Rendah</div>
                  <div className="text-xs text-green-600 mt-1">Rutin</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <span>Filter dan Pencarian</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                    <Search className="w-4 h-4 mr-2 text-blue-600" />
                    Pencarian AOI
                  </label>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan judul, deskripsi, atau PIC..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Priority Filter */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Prioritas</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Semua Prioritas</option>
                      <option value="CRITICAL">Kritis</option>
                      <option value="HIGH">Tinggi</option>
                      <option value="MEDIUM">Sedang</option>
                      <option value="LOW">Rendah</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Semua Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </select>
                  </div>

                  {/* Aspect Filter */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Aspek GCG</label>
                    <select
                      value={selectedAspect}
                      onChange={(e) => setSelectedAspect(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Semua Aspek</option>
                      {aspects.map(aspect => (
                        <option key={aspect} value={aspect}>
                          {aspect.replace('ASPEK ', '').replace('. ', ' - ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPriority('all');
                        setSelectedStatus('all');
                        setSelectedAspect('all');
                        setSearchTerm('');
                      }}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Reset Filter
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AOI List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daftar Area of Improvement</span>
                <Badge variant="secondary">
                  {filteredAOIs.length} dari {yearAOIs.length} AOI
                </Badge>
              </CardTitle>
              <CardDescription>
                Daftar lengkap area yang perlu diperbaiki untuk tahun {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAOIs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Tidak ada AOI yang ditemukan
                  </h3>
                  <p className="text-gray-500">
                    Coba ubah filter atau tambahkan AOI baru
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAOIs.map((aoi) => (
                    <div key={aoi.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{aoi.title}</h3>
                            <Badge className={getPriorityColor(aoi.priority)}>
                              {aoi.priority}
                            </Badge>
                            <Badge className={getStatusColor(aoi.status)}>
                              {getStatusIcon(aoi.status)}
                              <span className="ml-1">{aoi.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{aoi.description}</p>
                          
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Progress</span>
                              <span className="text-sm font-semibold text-gray-900">{aoi.progress}%</span>
                            </div>
                            <Progress value={aoi.progress} className="h-2" />
                          </div>

                          {/* Action Items */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Items ({aoi.actionItems.length})</h4>
                            <div className="space-y-2">
                              {aoi.actionItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center space-x-2 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    item.status === 'COMPLETED' ? 'bg-green-500' :
                                    item.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-yellow-500'
                                  }`} />
                                  <span className="text-gray-600">{item.description}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {item.status}
                                  </Badge>
                                </div>
                              ))}
                              {aoi.actionItems.length > 3 && (
                                <div className="text-sm text-gray-500">
                                  +{aoi.actionItems.length - 3} action items lainnya
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{aoi.assignedTo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(aoi.dueDate).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{aoi.aspect}</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/aoi/${aoi.id}`}
                          >
                            Lihat Detail
                          </Button>
                          <Button variant="outline" size="sm">
                            Update Progress
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AOIDashboard;
