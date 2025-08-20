import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface AOI {
  id: string;
  title: string;
  description: string;
  aspect: string; // GCG Aspect (ASPEK I, ASPEK II, etc.)
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  progress: number; // 0-100
  actionItems: ActionItem[];
  documents: string[]; // Related document IDs
  year: number;
}

export interface ActionItem {
  id: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string;
  dueDate: string;
  completedAt?: string;
}

interface AOIContextType {
  aois: AOI[];
  getAOIsByYear: (year: number) => AOI[];
  getAOIsByAspect: (aspect: string, year: number) => AOI[];
  getAOIsByStatus: (status: string, year: number) => AOI[];
  getAOIsByPriority: (priority: string, year: number) => AOI[];
  addAOI: (aoi: Omit<AOI, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAOI: (id: string, updates: Partial<AOI>) => void;
  deleteAOI: (id: string) => void;
  updateAOIProgress: (id: string, progress: number) => void;
  addActionItem: (aoiId: string, actionItem: Omit<ActionItem, 'id'>) => void;
  updateActionItem: (aoiId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (aoiId: string, actionItemId: string) => void;
  getAOIStats: (year: number) => {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const AOIContext = createContext<AOIContextType | undefined>(undefined);

export const AOIProvider = ({ children }: { children: ReactNode }) => {
  const [aois, setAOIs] = useState<AOI[]>([]);

  // Initialize data from localStorage
  useEffect(() => {
    const data = localStorage.getItem("aoiData");
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData)) {
          setAOIs(parsedData);
          console.log('AOIContext: Initialized from localStorage', parsedData.length);
        }
      } catch (error) {
        console.error('AOIContext: Error parsing localStorage data', error);
        initializeDefaultData();
      }
    } else {
      initializeDefaultData();
    }
  }, []);

  // Initialize with default data
  const initializeDefaultData = () => {
    const currentYear = new Date().getFullYear();
    const defaultAOIs: AOI[] = [
      {
        id: '1',
        title: 'Peningkatan Transparansi Laporan Keuangan',
        description: 'Meningkatkan kualitas dan detail laporan keuangan untuk memenuhi standar GCG',
        aspect: 'ASPEK I. Komitmen',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedTo: 'Tim Keuangan',
        dueDate: `${currentYear}-12-31`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: 65,
        actionItems: [
          {
            id: '1',
            description: 'Review standar pelaporan keuangan',
            status: 'COMPLETED',
            assignedTo: 'Manager Keuangan',
            dueDate: `${currentYear}-06-30`,
            completedAt: new Date().toISOString()
          },
          {
            id: '2',
            description: 'Implementasi sistem pelaporan digital',
            status: 'IN_PROGRESS',
            assignedTo: 'Tim IT',
            dueDate: `${currentYear}-09-30`
          }
        ],
        documents: [],
        year: currentYear
      },
      {
        id: '2',
        title: 'Penguatan Risk Management Framework',
        description: 'Mengembangkan framework manajemen risiko yang komprehensif',
        aspect: 'ASPEK III. Dewan Komisaris',
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedTo: 'Tim Risk Management',
        dueDate: `${currentYear}-12-31`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: 0,
        actionItems: [
          {
            id: '1',
            description: 'Identifikasi risiko utama',
            status: 'PENDING',
            assignedTo: 'Risk Officer',
            dueDate: `${currentYear}-08-31`
          }
        ],
        documents: [],
        year: currentYear
      }
    ];

    localStorage.setItem("aoiData", JSON.stringify(defaultAOIs));
    setAOIs(defaultAOIs);
    console.log('AOIContext: Initialized with default data', defaultAOIs.length);
  };

  // Save to localStorage whenever aois change
  useEffect(() => {
    localStorage.setItem("aoiData", JSON.stringify(aois));
  }, [aois]);

  const getAOIsByYear = useCallback((year: number): AOI[] => {
    return aois.filter(aoi => aoi.year === year);
  }, [aois]);

  const getAOIsByAspect = useCallback((aspect: string, year: number): AOI[] => {
    return aois.filter(aoi => aoi.aspect === aspect && aoi.year === year);
  }, [aois]);

  const getAOIsByStatus = useCallback((status: string, year: number): AOI[] => {
    return aois.filter(aoi => aoi.status === status && aoi.year === year);
  }, [aois]);

  const getAOIsByPriority = useCallback((priority: string, year: number): AOI[] => {
    return aois.filter(aoi => aoi.priority === priority && aoi.year === year);
  }, [aois]);

  const addAOI = useCallback((aoi: Omit<AOI, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAOI: AOI = {
      ...aoi,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updated = [...aois, newAOI];
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const updateAOI = useCallback((id: string, updates: Partial<AOI>) => {
    const updated = aois.map(aoi => 
      aoi.id === id 
        ? { ...aoi, ...updates, updatedAt: new Date().toISOString() }
        : aoi
    );
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const deleteAOI = useCallback((id: string) => {
    const updated = aois.filter(aoi => aoi.id !== id);
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const updateAOIProgress = useCallback((id: string, progress: number) => {
    const updated = aois.map(aoi => 
      aoi.id === id 
        ? { 
            ...aoi, 
            progress: Math.max(0, Math.min(100, progress)),
            updatedAt: new Date().toISOString(),
            status: progress >= 100 ? 'COMPLETED' : aoi.status
          }
        : aoi
    );
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const addActionItem = useCallback((aoiId: string, actionItem: Omit<ActionItem, 'id'>) => {
    const newActionItem: ActionItem = {
      ...actionItem,
      id: Date.now().toString()
    };
    
    const updated = aois.map(aoi => 
      aoi.id === aoiId 
        ? { ...aoi, actionItems: [...aoi.actionItems, newActionItem] }
        : aoi
    );
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const updateActionItem = useCallback((aoiId: string, actionItemId: string, updates: Partial<ActionItem>) => {
    const updated = aois.map(aoi => 
      aoi.id === aoiId 
        ? {
            ...aoi,
            actionItems: aoi.actionItems.map(item => 
              item.id === actionItemId 
                ? { ...item, ...updates }
                : item
            )
          }
        : aoi
    );
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const deleteActionItem = useCallback((aoiId: string, actionItemId: string) => {
    const updated = aois.map(aoi => 
      aoi.id === aoiId 
        ? {
            ...aoi,
            actionItems: aoi.actionItems.filter(item => item.id !== actionItemId)
          }
        : aoi
    );
    setAOIs(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('aoiUpdated', {
      detail: { type: 'aoiUpdated', data: updated }
    }));
  }, [aois]);

  const getAOIStats = useCallback((year: number) => {
    const yearAOIs = aois.filter(aoi => aoi.year === year);
    
    return {
      total: yearAOIs.length,
      completed: yearAOIs.filter(aoi => aoi.status === 'COMPLETED').length,
      inProgress: yearAOIs.filter(aoi => aoi.status === 'IN_PROGRESS').length,
      pending: yearAOIs.filter(aoi => aoi.status === 'PENDING').length,
      critical: yearAOIs.filter(aoi => aoi.priority === 'CRITICAL').length,
      high: yearAOIs.filter(aoi => aoi.priority === 'HIGH').length,
      medium: yearAOIs.filter(aoi => aoi.priority === 'MEDIUM').length,
      low: yearAOIs.filter(aoi => aoi.priority === 'LOW').length
    };
  }, [aois]);

  return (
    <AOIContext.Provider value={{
      aois,
      getAOIsByYear,
      getAOIsByAspect,
      getAOIsByStatus,
      getAOIsByPriority,
      addAOI,
      updateAOI,
      deleteAOI,
      updateAOIProgress,
      addActionItem,
      updateActionItem,
      deleteActionItem,
      getAOIStats
    }}>
      {children}
    </AOIContext.Provider>
  );
};

export const useAOI = () => {
  const ctx = useContext(AOIContext);
  if (!ctx) throw new Error("useAOI must be used within AOIProvider");
  return ctx;
};
