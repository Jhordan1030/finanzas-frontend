import React from 'react'
import { FileText, Download } from 'lucide-react'
import Button from './Button'

const PDFButton = ({ 
  onClick, 
  loading = false,
  variant = 'primary',
  size = 'medium',
  children = 'Generar PDF',
  ...props 
}) => {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      variant={variant}
      size={size}
      {...props}
    >
      <FileText className="h-4 w-4 mr-2" />
      {children}
      <Download className="h-4 w-4 ml-2" />
    </Button>
  )
}

export default PDFButton