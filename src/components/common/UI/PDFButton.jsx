import React from 'react';
import Button from './Button';
import { FileText, Download } from 'lucide-react';

const PDFButton = ({
                       data,
                       filename = 'reporte.pdf',
                       variant = 'secondary',
                       size = 'medium',
                       loading = false,
                       onClick,
                       ...props
                   }) => {

    const handleClick = async () => {
        if (onClick) {
            onClick();
            return;
        }

        // Lógica básica para generar PDF
        console.log('Generando PDF con datos:', data);

        // Ejemplo simple de descarga
        const blob = new Blob(['Contenido del PDF'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            variant={variant}
            size={size}
            loading={loading}
            onClick={handleClick}
            {...props}
        >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PDF</span>
            <Download className="hidden sm:block h-4 w-4 ml-2" />
        </Button>
    );
};

export default PDFButton;