import { Icon } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { useEffect, useState } from 'react';
import './App.css'
import rock from './assets/rock.png'
import { db } from './firebase-config';
import { storage } from './firebase-config';
import DeleteIcon from '@mui/icons-material/Delete';

export function ItemList({userId, id, name, img, handleSeeBloc, handleDeleteBloc}) {
    const [imgSrc, setImgSrc] = useState('')
    const [nbrVideos, setNbrVideos] = useState('')

    useEffect(() =>{
        if (img){
            const pathReference = ref(storage, `images/${id + '/' + img}`);
            const getUrl = async () => {
                const data = await getDownloadURL(pathReference);
                setImgSrc(data)
            }
            getUrl()
        }
        else{
            setImgSrc(rock)
        }

        const getNbrVideos = async () => {
            const videosDB = await getDocs(collection(db, "Users/" + userId + "/blocs/" + id + "/videos"))
            setNbrVideos(videosDB.docs.length)
          }
          getNbrVideos()
    }, [id, img, userId])
      
   
    return (
        <div className='oneItem'>
            <div onClick={() => handleSeeBloc(id)} className='halfWidth'>
                <img className='imgStyle' src={imgSrc} alt={`cover`} />
            </div>
            <div onClick={() => handleSeeBloc(id)} className='infos'>
                <div className='titleInfos'>{name}</div>
                {nbrVideos === 1 || nbrVideos === 0 ? (
                    <div>{nbrVideos} video</div> 
                )
                : (
                    <div>{nbrVideos} videos</div> 
                )}
            </div>
            <div onClick={() => handleDeleteBloc(id)} className='rightPart'>
                <DeleteIcon style={{ width: '100%', color: '#fff' }} />
            </div>
        </div>
    )
}