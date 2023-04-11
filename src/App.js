import { useEffect, useState } from 'react';
import './App.css';
import { auth, db, storage } from './firebase-config';
import { addDoc, collection, deleteDoc, doc, enableIndexedDbPersistence, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { browserLocalPersistence, RecaptchaVerifier, setPersistence, signInWithPhoneNumber } from "firebase/auth";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, TextField } from "@mui/material"
import { ItemList } from './ItemList';
import { ref, uploadBytes } from 'firebase/storage';
import { Video } from './Video';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import rock from './assets/rock.png'

function App() {
  const [firstLoading, setFirstLoading] = useState(true) 
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [shouldEnterCode, setShouldEnterCode] = useState(false)
  const [shouldDisableBtn, setShouldDisableBtn] = useState(false)
  const [btnTextSignIn, setBtnTextSignIn] = useState('Se connecter')
  const [user, setUser] = useState(() => {
    const user = auth.currentUser;
    return user;
  });

  const [openSnackInfos, setOpenSnackInfos] = useState(false)
  const [textSnackBar, setTextSnackBar] = useState('')
  const [severitySnackBar, setSeveritySnackBar] = useState('success')

  const [addingProject, setAddingProject] = useState(false)
  const [consultBloc, setConsultBloc] = useState(false)
  const [disableAddVideo, setDisableAddVideo] = useState(true)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  const usersBlocsCollectionRef = collection(db, "Users/" + user?.uid + "/blocs")

  const [searchValue, setSearchValue] = useState('')
  
  const [blocs, setBlocs] = useState(null)
  const [blocId, setBlocId] = useState(undefined)
  const [videos, setVideos] = useState(null)

  const [addName, setAddName] = useState('')
  const [addImage, setAddImage] = useState(null)
  const [imageURL, setImageURL] = useState(null)

  const [addVideo, setAddVideo] = useState(null)

  const [openConfirm, setOpenConfirm] = useState(false)
  const [blocIdToDelete, setBlocIdToDelete] = useState('')

  useEffect(() => {
    auth.onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
      setFirstLoading(false)
    });
  }, [])

  useEffect(() => {
    if (code.length === 6){
      window.confirmationResult.confirm(code).then((result) => {
        // User signed in successfully.
        // User set in onAuthStateChanged
      }).catch((error) => {
        //Code incorrect
        setSeveritySnackBar('error')
        setTextSnackBar('Code invalide')
        setOpenSnackInfos(true)
      });
    }
  }, [code])

  const onSignInSubmit = (event) => {
    event.preventDefault();
    if (phoneNumber === '' || (phoneNumber.replaceAll(' ', '').length !== 10 && (phoneNumber.replaceAll(' ', '').length !== 12 || !phoneNumber.includes('+33')))) {
      setSeveritySnackBar('error')
      setTextSnackBar('Numéro de téléphone incorrect')
      setOpenSnackInfos(true)
      return;
    }
    setShouldDisableBtn(true);
    setUpRecaptcha();
    if (!phoneNumber.includes('+33')){
      setPhoneNumber('+33' + phoneNumber.slice(1))
    }
  }

  useEffect(() => {
    if (phoneNumber.includes('+33')){
      var appVerifier = window.recaptchaVerifier;
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          signInWithPhoneNumber(auth, phoneNumber, appVerifier).then(function (confirmationResult) {
            window.confirmationResult = confirmationResult;
            setShouldEnterCode(true)
            setTimeout(() => {
              /*setBtnTextSignIn('Renvoyer le code')
              setShouldDisableBtn(false)*/
            }, 5000)
          })
          .catch((error) => {
            /*setBtnTextSignIn('Renvoyer le code')
            setShouldDisableBtn(false)*/
          })
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
        });
    }
  }, [phoneNumber])

  const setUpRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha', {
      'size': 'invisible',
      'callback': (response) => {
        console.log('captcha ok')
      }
    }, auth);
  }

  useEffect(() => {
    if (user){
      const docRef = doc(db, "Users", user.uid);
      const getUserBlocs = async () => {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()){
          //User exists in DB, getting his boulders
          updateDisplayedBlocs();
        }
        else{
          //User does not exist, creating ...
          await setDoc(doc(db, "Users", user.uid), { phoneNumber: phoneNumber })
          updateDisplayedBlocs();
        }
      }
      getUserBlocs()
    }
}, [user, phoneNumber])

  const swapAddMode = () => {
    if (addingProject){
      setAddImage(null)
      setAddName('')
    }
    setAddingProject(!addingProject)
  }

  const handleSeeBloc = (blocId) => {
    setConsultBloc(true)
    setBlocId(blocId)  
  }
  
  const handleCloseConfirm = () => {
    setOpenConfirm(false)
  }

  const handleOpenConfirm = (blocId) => {
    setBlocIdToDelete(blocId)
    setOpenConfirm(true)
  }

  const handleDeleteBloc = () => {
    const deleteBloc = async () => {
      const docRef = await deleteDoc(doc(db, "Users/" + user?.uid + "/blocs/" + blocIdToDelete ))
    }
    deleteBloc().then(() => {
      setOpenConfirm(false)
      updateDisplayedBlocs()
    })
  }

  useEffect(() => {
    updateDisplayedVideos()
  }, [blocId])

  const handleBackToBoulderList = () => {
    setConsultBloc(false)
    setAddingProject(false)
    setAddVideo(null)
    setVideos(null)
    setBlocId(undefined)
  }
  
  const handleChangeSearch = (event) => {
    setSearchValue(event.target.value)
  }

  const handleChangeAddName = (event) => {
    setAddName(event.target.value)
  }

  const updateDisplayedBlocs = () => {
    const getBlocs = async () => {
      const blocs = await getDocs(usersBlocsCollectionRef)
      setBlocs(blocs.docs.map((doc) => ({...doc.data(), id: doc.id})))
    }
    getBlocs()
  }
  
  const updateDisplayedVideos = () => {
    const getVideos = async () => {
      const videosDB = await getDocs(collection(db, "Users/" + user?.uid + "/blocs/" + blocId + "/videos"))
      setVideos(videosDB.docs.map((doc) => ({...doc.data(), id: doc.id})))
    }
    getVideos()
  }
  
  const handleAddNewProj = () => {
    const addBloc = async () => {
      if (addImage) {
        const docRef = await addDoc(usersBlocsCollectionRef, { nom: addName, imgName: addImage.name })
        const imageRef = ref(storage, `images/${docRef.id + '/' + addImage.name}`)
        uploadBytes(imageRef, addImage).then(() => {
          updateDisplayedBlocs();
          setSeveritySnackBar('success')
          setTextSnackBar('Bloc ajouté !')
          setOpenSnackInfos(true)
        })
      }
      else {
        const docRef = await addDoc(usersBlocsCollectionRef, { nom: addName })
        updateDisplayedBlocs();
        setSeveritySnackBar('success')
        setTextSnackBar('Bloc ajouté !')
        setOpenSnackInfos(true)
      }
      swapAddMode()
    }
    addBloc()
  }
  
  const handleAddNewVideo = () => {
    setDisableAddVideo(true)
    setIsUploadingVideo(true)
    const addNewVideo = async () => {
      await addDoc(collection(db, "Users/" + user?.uid + "/blocs/" + blocId + "/videos"), { vidName: addVideo.name })
      const videoRef = ref(storage, `videos/${blocId + '/' + addVideo.name}`)
      uploadBytes(videoRef, addVideo).then(() => {
        setIsUploadingVideo(false)
        setAddVideo(null)
        updateDisplayedVideos();
        setSeveritySnackBar('success')
        setTextSnackBar('Vidéo ajoutée !')
        setOpenSnackInfos(true)
      })
    }
    addNewVideo()
  }

  function onImageChange(e) {
    if (e.target.files.length > 0){
        setAddImage(e.target.files[0])
    }
  }
  
  function onVideoChange(e) {
    if (e.target.files.length > 0){
      setDisableAddVideo(false)
      setAddVideo(e.target.files[0])
    }
  }

  useEffect(() => {
    if (addImage != null){
        setImageURL(URL.createObjectURL(addImage))
    }
  }, [addImage])

  return (
    <>
      {firstLoading ? (
        <div className='centerLoader'>
          <div className="loaderApp"></div>
        </div>
      )
      : (
        <>
        {!user && (
          <div className="App">
          <div className="form">
            <div id="recaptcha"></div>
            <span className='titleApp'>Blocs Betas</span>
            <TextField label="N° téléphone" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} />
            { shouldEnterCode && (
              <TextField label="Code reçu" value={code} onChange={event => setCode(event.target.value)} />
            )}
            <Button disabled={shouldDisableBtn} onClick={onSignInSubmit} id="sign-in-button" variant="contained" color='success'>{btnTextSignIn}</Button>
          </div>
          </div>
        )}
        {user && !consultBloc && (
          <div className="detail">
            {addingProject ? (
              <Button sx={{ marginBottom: '10px' }} color='success' variant="contained" className='addButton' onClick={swapAddMode}>Annuler</Button>
            )
            : (
              <Button sx={{ marginBottom: '10px' }} color='success' variant="contained" className='addButton' onClick={swapAddMode}>Ajouter un bloc</Button>
            )}
            <TextField 
              label="Rechercher" 
              sx={{ input: { color: 'white' } }}  
              value={searchValue} 
              onChange={handleChangeSearch} />
            <div className="listProjs">
              {addingProject && (
                <div className='oneItem'>
                  {addImage ? (
                      <img className='imgStyle' src={imageURL} alt='cover' />
                  ) : (
                      <img className='imgStyle' src={rock} alt='' />
                  ) }
                  <div className='addInfos'>
                    <TextField placeholder="Nom du bloc" value={addName} onChange={handleChangeAddName} />
                    <Button variant='contained' color='success' className='' aria-label="upload picture" component="label">
                      Image
                      <input hidden accept="image/*" type="file" onChange={onImageChange} />
                    </Button>
                    <Button disabled={addName === ''} onClick={handleAddNewProj} variant='contained' color='success'>
                      Ajouter
                    </Button>
                  </div>
                </div>
              )}
              {blocs?.filter(bloc => 
                searchValue === '' 
                || bloc.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
                  .includes(searchValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()))
              .map(bloc => (
                <ItemList handleSeeBloc={handleSeeBloc} handleDeleteBloc={handleOpenConfirm} key={bloc.id} userId={user?.uid} id={bloc.id} name={bloc.nom} img={bloc.imgName} />
              ))}
              {blocs?.length === 0 && (
                <div className='noBloc'>
                  Vous n'avez aucun bloc d'enregistré, ajoutez en un pour pouvoir ajouter des méthodes !
                </div>
              )}
            </div>
          </div>
        )}
        {user && consultBloc && ( 
          <div className='vidList'>
            <div className='backToBlocList' onClick={handleBackToBoulderList}>
              <ArrowBackIosIcon />
              <h2>Retour à la liste des blocs</h2>
            </div>
            {isUploadingVideo ? (
              <div className='btnNewVideo'>
                <div className="loader"></div>
              </div>
            )
            : (
              <>
                <div className='btnNewVideo'>
                  <Button variant='contained' color='success' className='' aria-label="upload video" component="label">
                    Nouvelle vidéo
                    <input hidden accept="video/*" type="file" onChange={onVideoChange} />
                  </Button>
                  <Button disabled={disableAddVideo} onClick={handleAddNewVideo} variant='contained' color='success'>
                    Ajouter
                  </Button>
                </div>
                {addVideo && (
                  <div className='videoName'>{addVideo.name}</div>
                )}
              </>
            )}          
            {videos?.map(video => (
              <div key={video.id} className='videosStyle'>
                <Video blocId={blocId} video={video.vidName} />
              </div>
            ))}
            {videos?.length === 0 && (
              <div className='noBloc'>
                Vous n'avez aucune video d'enregistrée, ajoutez en une pour pouvoir la consulter par la suite !
              </div>
            )}
        </div>
        )}  
        <Snackbar anchorOrigin={{ vertical: 'top', horizontal : 'right' }} open={openSnackInfos} autoHideDuration={6000} onClose={() => setOpenSnackInfos(false)}>
            <Alert onClose={() => setOpenSnackInfos(false)} severity={severitySnackBar} sx={{ width: '100%' }} variant="filled" elevation={6}>
                {textSnackBar}
            </Alert>
        </Snackbar>
        <Dialog
          open={openConfirm}
          onClose={handleCloseConfirm}
        >
          <DialogTitle>
            {"Confirmer la suppression ?"}
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleCloseConfirm}>Annuler</Button>
            <Button onClick={handleDeleteBloc}>Supprimer</Button>
          </DialogActions>
        </Dialog>
        </>
      )}
    </>
  );
}

export default App;
