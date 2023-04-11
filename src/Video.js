import { getDownloadURL, ref } from 'firebase/storage';
import { useEffect, useState } from 'react';
import './App.css'
import { storage } from './firebase-config';
import videoImg from './assets/video.png'

export function Video({blocId, video}) {
    const [videoSrc, setVideoSrc] = useState('')

    useEffect(() =>{
        if (video){
            const pathReference = ref(storage, `videos/${blocId + '/' + video}`);
            const getUrl = async () => {
                const data = await getDownloadURL(pathReference);
                setVideoSrc(data)
            }
            getUrl()
        }
        else{
            setVideoSrc(null)
        }
    }, [blocId, video])
    
    return (
        <div>
            <video className='oneVideo' poster={videoImg} src={videoSrc} controls />
        </div>
    )
}