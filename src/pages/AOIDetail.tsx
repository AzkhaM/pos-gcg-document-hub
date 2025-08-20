import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Target,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { useAOI, AOI, ActionItem } from '@/contexts/AOIContext';
import { useYear } from '@/contexts/YearContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PageHeaderPanel } from '@/components/panels';

const AOIDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useYear();
  const { isSidebarOpen } = useSidebar();
  const { 
    aois, 
    updateAOI, 
    deleteAOI, 
    updateAOIProgress,
    addActionItem,
    updateActionItem,
    deleteActionItem
  } = useAOI();

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  
  // Form states
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: '',
    status: '',
    assignedTo: '',
    dueDate: '',
    aspect: ''
  });

  const [actionForm, setActionForm] = useState({
    description: '',
    assignedTo: '',
    dueDate: '',
    status: 'PENDING'
  });

  // Get AOI data
  const aoi = useMemo(() => {
    return aois.find(a => a.id === id);
  }, [aois, id]);

  // Initialize edit form when AOI data changes
  useEffect(() => {
    if (aoi) {
      setEditForm({
        title: aoi.title,
        description: aoi.description,
        priority: aoi.priority,
        status: aoi.status,
        assignedTo: aoi.assignedTo,
        dueDate: aoi.dueDate,
        aspect: aoi.aspect
      });
    }
  }, [aoi]);

  // Handle edit form changes
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle action form changes
  const handleActionFormChange = (field: string, value: string) => {
    setActionForm(prev => ({ ...prev, [field]: value }));
  };

  // Save AOI changes
  const handleSaveAOI = () => {
    if (aoi && editForm.title && editForm.description) {
      updateAOI(aoi.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority as any,
        status: editForm.status as any,
        assignedTo: editForm.assignedTo,
        dueDate: editForm.dueDate,
        aspect: editForm.aspect
      });
      setIsEditing(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (aoi) {
      setEditForm({
        title: aoi.title,
        description: aoi.description,
        priority: aoi.priority,
        status: aoi.status,
        assignedTo: aoi.assignedTo,
        dueDate: aoi.dueDate,
        aspect: aoi.aspect
      });
    }
    setIsEditing(false);
  };

  // Add new action item
  const handleAddAction = () => {
    if (aoi && actionForm.description && actionForm.assignedTo && actionForm.dueDate) {
      addActionItem(aoi.id, {
        description: actionForm.description,
        assignedTo: actionForm.assignedTo,
        dueDate: actionForm.dueDate,
        status: actionForm.status as any
      });
      
      // Reset form
      setActionForm({
        description: '',
        assignedTo: '',
        dueDate: '',
        status: 'PENDING'
      });
      setIsAddingAction(false);
    }
  };

  // Update action item
  const handleUpdateAction = (actionId: string, updates: Partial<ActionItem>) => {
    if (aoi) {
      updateActionItem(aoi.id, actionId, updates);
      setEditingActionId(null);
    }
  };

  // Delete action item
  const handleDeleteAction = (actionId: string) => {
    if (aoi && window.confirm('Apakah Anda yakin ingin menghapus action item ini?')) {
      deleteActionItem(aoi.id, actionId);
    }
  };

  // Delete AOI
  const handleDeleteAOI = () => {
    if (aoi && window.confirm('Apakah Anda yakin ingin menghapus AOI ini? Tindakan ini tidak dapat dibatalkan.')) {
      deleteAOI(aoi.id);
      navigate('/aoi-dashboard');
    }
  };

  // Update progress
  const handleProgressChange = (newProgress: number) => {
    if (aoi) {
      updateAOIProgress(aoi.id, newProgress);
    }
  };

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

  if (!aoi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Sidebar />
        <Topbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AOI Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-4">AOI yang Anda cari tidak ditemukan atau telah dihapus.</p>
            <Button onClick={() => navigate('/aoi-dashboard')}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/aoi-dashboard')}
                className="border-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detail AOI</h1>
                <p className="text-gray-600">Area of Improvement - {selectedYear}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteAOI}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSaveAOI}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-gray-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AOI Information */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span>Informasi AOI</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Judul AOI</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.title}
                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                        className="mt-1"
                        placeholder="Masukkan judul AOI"
                      />
                    ) : (
                      <h2 className="text-xl font-semibold text-gray-900 mt-1">{aoi.title}</h2>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Deskripsi</Label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => handleEditFormChange('description', e.target.value)}
                        className="mt-1"
                        rows={3}
                        placeholder="Masukkan deskripsi AOI"
                      />
                    ) : (
                      <p className="text-gray-600 mt-1">{aoi.description}</p>
                    )}
                  </div>

                  {/* Priority and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Prioritas</Label>
                      {isEditing ? (
                        <select
                          value={editForm.priority}
                          onChange={(e) => handleEditFormChange('priority', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">Rendah</option>
                          <option value="MEDIUM">Sedang</option>
                          <option value="HIGH">Tinggi</option>
                          <option value="CRITICAL">Kritis</option>
                        </select>
                      ) : (
                        <Badge className={`mt-1 ${getPriorityColor(aoi.priority)}`}>
                          {aoi.priority}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Status</Label>
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => handleEditFormChange('status', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Selesai</option>
                          <option value="CANCELLED">Dibatalkan</option>
                        </select>
                      ) : (
                        <Badge className={`mt-1 ${getStatusColor(aoi.status)}`}>
                          {getStatusIcon(aoi.status)}
                          <span className="ml-1">{aoi.status.replace('_', ' ')}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Assigned To and Due Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Ditetapkan Kepada</Label>
                      {isEditing ? (
                        <Input
                          value={editForm.assignedTo}
                          onChange={(e) => handleEditFormChange('assignedTo', e.target.value)}
                          className="mt-1"
                          placeholder="Masukkan nama tim/PIC"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 mt-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{aoi.assignedTo}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Tanggal Jatuh Tempo</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => handleEditFormChange('dueDate', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            {new Date(aoi.dueDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aspect */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Aspek GCG</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.aspect}
                        onChange={(e) => handleEditFormChange('aspect', e.target.value)}
                        className="mt-1"
                        placeholder="Masukkan aspek GCG"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900">{aoi.aspect}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Tracking */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Progress Tracking</span>
                  </CardTitle>
                  <CardDescription>
                    Update progress AOI dan lihat perkembangan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-gray-700">Progress Saat Ini</Label>
                        <span className="text-lg font-bold text-gray-900">{aoi.progress}%</span>
                      </div>
                      <Progress value={aoi.progress} className="h-3" />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Update Progress
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={aoi.progress}
                          onChange={(e) => handleProgressChange(parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                        <span className="text-gray-600">%</span>
                        <Button
                          size="sm"
                          onClick={() => handleProgressChange(aoi.progress)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                        <span>Action Items</span>
                      </CardTitle>
                      <CardDescription>
                        Daftar tindakan yang perlu dilakukan untuk menyelesaikan AOI
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsAddingAction(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Action
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAddingAction && (
                    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">Tambah Action Item Baru</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">Deskripsi</Label>
                          <Textarea
                            value={actionForm.description}
                            onChange={(e) => handleActionFormChange('description', e.target.value)}
                            placeholder="Masukkan deskripsi action item"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">Ditetapkan Kepada</Label>
                            <Input
                              value={actionForm.assignedTo}
                              onChange={(e) => handleActionFormChange('assignedTo', e.target.value)}
                              placeholder="Masukkan nama PIC"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">Tanggal Jatuh Tempo</Label>
                            <Input
                              type="date"
                              value={actionForm.dueDate}
                              onChange={(e) => handleActionFormChange('dueDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleAddAction} className="bg-purple-600 hover:bg-purple-700">
                            <Save className="w-4 h-4 mr-2" />
                            Simpan
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingAction(false)}
                            className="border-gray-200"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Batal
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {aoi.actionItems.map((action) => (
                      <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                        {editingActionId === action.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={action.description}
                              onChange={(e) => handleUpdateAction(action.id, { description: e.target.value })}
                              rows={2}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                value={action.assignedTo}
                                onChange={(e) => handleUpdateAction(action.id, { assignedTo: e.target.value })}
                                placeholder="PIC"
                              />
                              <Input
                                type="date"
                                value={action.dueDate}
                                onChange={(e) => handleUpdateAction(action.id, { dueDate: e.target.value })}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => setEditingActionId(null)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingActionId(null)}
                                className="border-gray-200"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{action.description}</h4>
                                <Badge className={getStatusColor(action.status)}>
                                  {action.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{action.assignedTo}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due: {new Date(action.dueDate).toLocaleDateString('id-ID')}</span>
                                </div>
                                {action.completedAt && (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Completed: {new Date(action.completedAt).toLocaleDateString('id-ID')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingActionId(action.id)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAction(action.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {aoi.actionItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada action items</p>
                        <p className="text-sm">Tambahkan action item untuk memulai implementasi AOI</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{aoi.progress}%</div>
                    <div className="text-sm text-blue-700">Progress</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {aoi.actionItems.filter(item => item.status === 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-green-700">Action Items Selesai</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {aoi.actionItems.filter(item => item.status === 'PENDING').length}
                    </div>
                    <div className="text-sm text-yellow-700">Action Items Pending</div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Dibuat</div>
                        <div className="text-gray-500">
                          {new Date(aoi.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Terakhir Diupdate</div>
                        <div className="text-gray-500">
                          {new Date(aoi.updatedAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-semibold">Jatuh Tempo</div>
                        <div className="text-gray-500">
                          {new Date(aoi.dueDate).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Documents */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Dokumen Terkait</CardTitle>
                </CardHeader>
                <CardContent>
                  {aoi.documents.length > 0 ? (
                    <div className="space-y-2">
                      {aoi.documents.map((docId, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Dokumen {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Belum ada dokumen terkait</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AOIDetail;
