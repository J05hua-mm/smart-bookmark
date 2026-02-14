'use client'

import { supabase } from '@/lib/supabase';
import {User} from '@supabase/supabase-js';
import { useEffect,useState } from 'react';
import Bookmarkimg from '../images/bookmarkimg';
import Googleimg from '../images/Googleimg';
import Bookmarkcheck from '../images/bookmarkcheck';
import Deleteimg from '../images/Delete';

export default function Home() {

  const [user,setUser] = useState<User | null>(null);
  const [title,setTitle] = useState('');
  const [url,setUrl] = useState('');
  const [bookmarks,setBookmarks] = useState<any[]>([]);
  const [loading,setLoading] = useState(false);



  const fetchBookmarks = async () => {

     if(!user) {
      return;
     }

     const {data,error} = await supabase
     .from('bookmarks')
     .select('*')
     .order('created_at',{ascending:false})

     if(error) {
            console.error('Fetch error:', error.message);
     } 
     else {
     setBookmarks(data);
     }

  }



  useEffect( () => {

      const getSession = async () => {
      const {data} = await supabase.auth.getSession();
      setUser(data.session?.user ?? null)
      };

     getSession();

    const {data:listener} = supabase.auth.onAuthStateChange(
     (_event,session) => {
        setUser(session?.user ?? null)
     }
     );

    return () => {
      listener.subscription.unsubscribe()
    };

  },[]);



  useEffect(() => {

     if(user) {
        fetchBookmarks();
     }

  },[user]);



  useEffect(() => {

    if(!user) {
      return;
    }

    const channel = supabase.channel('bookmarks-channel')
    .on('postgres_changes',
      {
      event:'*',
      schema:'public',
      table:'bookmarks',
      filter:`user_id=eq.${user.id}`
    },
    () => {
      fetchBookmarks()
    }
  ).subscribe()


  return () => {
    supabase.removeChannel(channel)
  }
  },[user])



  const normalizeUrl = (input:string) => {

      try {
        const url = input.startsWith('http') ? input : `http://${input}`
        return new URL(url).toString();
      }
      catch {
        return null;
      }
    }




  const handleAddBookmark = async () => {

      if(!user) return;

      if(!title.trim() || !url.trim()) return;

      const formatedUrl = normalizeUrl(url.trim());
      if(!formatedUrl) {
        alert('enter a valid url');
        return;
      }

      setLoading(true);

      const { error } = await supabase.from('bookmarks').insert([
       {
         title:title.trim(),
         url:formatedUrl,
         user_id:user.id,
       },
     ])

     setLoading(false);

     if(error) {
         console.log('Insert error: ', error.message);
     }
     else {
     setTitle('');
     setUrl('');
     fetchBookmarks();
     }

    }






  const handleDelete = async (id:string) => {

      const {error} = await supabase
      .from('bookmarks')
      .delete()
      .eq('id',id)

       if(error) {
          console.error('Delete error:', error.message);
        }
       else {
       fetchBookmarks();
       }
  }



  const handleLogin = async () => {
      await supabase.auth.signInWithOAuth({
       provider:'google'
      })
  }



  const handleLogout = async () => {
      await supabase.auth.signOut();
  }



  return (
    <main className="flex min-h-screen items-center justify-center">

      {/* after login  */}


     { user ? (     
           
            <div className="text-center space-y-4 size-full h-screen w-screen flex flex-col">
         
              <div className='flex felx-row justify-center'>

                       <div className='flex flex-row pt-10'>
                        <Bookmarkimg height='24px' width='24px'/> 
                        <h1 className="text-3xl font-semibold">Smart Bookmark.</h1>
                      </div>

              </div>

            <div className='flex flex-col pt-10'>
          
                      <div className='self-center'>
            
                             <input
                             type='text'
                             placeholder='Title'
                             value={title}
                             onChange={(e) => setTitle(e.target.value)}
                             className="w-full border pt-2 pb-2 pl-4 pr-4 rounded mt-2"
                             />

                             <input
                             type='text'
                             placeholder='Url'
                             value={url}
                             onChange={(e) => setUrl(e.target.value)}
                             className="w-full border pt-2 pb-2 pl-4 pr-4 rounded mt-2"
                             />

                             <button 
                             onClick={handleAddBookmark}
                             className="w-full bg-blue-500 text-white py-2 rounded mt-2 cursor-pointer"
                             disabled={loading}
                            >{ loading ? 'Adding...' : 'Add Bookmark'}</button>

                      </div>
          
                       <div className='pt-20 flex flex-col gap-2 overflow-scroll'>
                            {bookmarks.map( (bookmark) => (
                                 <div
                                  key={bookmark.id}
                                  className="border pr-2 pt-0.5 pl-2 pb-0.5 rounded flex justify-between self-center w-120"
                                   >
                      
                                  <div className='self-center'>
                                  <Bookmarkcheck/>
                                  </div>  

                                  <div>
                                  <p className="font-semibold text-clip">{bookmark.title}</p>
                                  <a
                                  href={bookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 text-sm text-clip"
                                  >
                                  {bookmark.url}
                                  </a>
                                 </div>

                                 <button 
                                 onClick={() => handleDelete(bookmark.id)} 
                                 className="text-red-500 cursor-pointer" 
                                 >
                                <Deleteimg/>
                                </button>

                   </div>
            ))}


          </div>

          </div> 

                        <div className='absolute mt-10 right-10'>
                             <button
                             onClick={handleLogout}
                             className="bg-black text-white px-5 py-1 rounded-2xl mb-3 text-sm cursor-pointer "
                             >
                             Logout
                             </button>
                             <p className='text-sm'>Welcome </p>
                            <p className='text-sm'>{user.email}</p>
                       </div>  
          
       </div> 
       
      )  :   (

// before login
             
             <div className="text-center space-y-2">
              
                       <div className='flex flex-row'>
                       <Bookmarkimg height='34px' width='34px'/>
                       <h1 className="text-6xl font-semibold text-neutral-800">Smart Bookmark.</h1>
                       </div>
              
                      <p className='text-sm text-gray-600'>Save and manage your personal bookmarks securely.</p>

                      <button
                      onClick={handleLogin}
                      className="bg-white text-white px-6 py-3 rounded-lg flex flex-row gap-2 ml-40 mt-10 border-solid border-neutral-800 border-2 cursor-pointer hover:bg-gray-100"
                       >
                       <p className='text-black self-center text-neutral-800'>Sign in with.</p>
                       <Googleimg/>
                       </button>

            </div>

        )
        }
     

    </main>
  )
}
