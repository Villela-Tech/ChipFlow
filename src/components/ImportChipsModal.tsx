'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ImportChipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportChipsModal({ isOpen, onClose, onImportComplete }: ImportChipsModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Formato de arquivo não suportado. Use XLSX, XLS ou CSV.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/chips/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar arquivo');
      }

      toast.success(`Importação concluída! ${data.imported} chips importados.`);
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Importar Chips</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Área de Upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${selectedFile ? 'bg-green-50 border-green-500' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="w-12 h-12 text-green-500 mb-2" />
              <p className="text-green-600 font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(selectedFile.size / 1024).toFixed(1)}KB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="mt-2"
              >
                Remover arquivo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">
                Arraste e solte seu arquivo aqui ou
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Escolher arquivo
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-4">
                Formatos suportados: XLSX, XLS, CSV
              </p>
            </div>
          )}
        </div>

        {/* Template de exemplo */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Estrutura do arquivo:
          </h3>
          <p className="text-sm text-gray-600">
            Seu arquivo deve conter as seguintes colunas:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
            <li>name (obrigatório)</li>
            <li>description (opcional)</li>
            <li>type (opcional, padrão: "default")</li>
            <li>status (opcional, padrão: "active")</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isUploading ? 'Importando...' : 'Importar'}
          </Button>
        </div>
      </div>
    </div>
  );
} 