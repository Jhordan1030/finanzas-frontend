import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', className = '', fullScreen = false }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16'
    };

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
                <Loader2 className={`${sizeClasses.xl} animate-spin text-blue-600`} />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        </div>
    );
};

export default LoadingSpinner;