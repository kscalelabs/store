import React, { useState, useEffect } from 'react';
import { api, Bom } from "hooks/api";
import { useAuthentication } from 'hooks/auth';

interface ImageProps {
    imageId: string;
}

const ImageComponent: React.FC<ImageProps> = ({ imageId }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const auth = useAuthentication();
    const auth_api = new api(auth.api);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await auth_api.getImage(imageId);
                const url = URL.createObjectURL(response);
                setImageSrc(url);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch image ' + imageId);
                setLoading(false);
            }
        };

        fetchImage();
    }, [imageId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div style={{ width: '100%', paddingTop: '100%', position: 'relative' }}>
            {imageSrc && <img src={imageSrc} alt="Robot" className="d-block rounded-lg"
                style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                }} />
            }
        </div>
    );
};

export default ImageComponent;
