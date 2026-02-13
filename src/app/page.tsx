// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

'use client'

import { supabase } from '@/lib/supabase';
import {User} from '@supabase/supabase-js';
import { useEffect,useState } from 'react';

export default function Home() {

  const [user,setUser] = useState<User | null>(null);
  const [title,setTitle] = useState('');
  const [url,setUrl] = useState('');
  const [bookmarks,setBookmarks] = useState<any[]>([]);

  const fetchbookmarks = async () => {

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
    }


    getSession();


    const {data:listener} = supabase.auth.onAuthStateChange(
      (_event,session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }


  },[]);

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
      fetchbookmarks()
    }
  ).subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
  },[user])

  useEffect(() => {
    if(user) {
      fetchbookmarks();
    }
  },[user]);

  const handleAddBookmark = async () => {

   if(!user) return;

   const { error } = await supabase.from('bookmarks').insert([
    {
      title,
      url,
      user_id:user.id,
    },
   ])

   if(error) {
    console.log('Insert error: ', error.message);
   }
   else {
    setTitle('');
    setUrl('');
    fetchbookmarks();
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
    fetchbookmarks();
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

     { user ? (<div className="text-center space-y-4">
          <p>Welcome {user.email}</p>
          
          <input
          type='text'
          placeholder='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          />

          <input
          type='text'
          placeholder='Url'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border p-2 rounded"
          />

          <button 
          onClick={handleAddBookmark}
          className="w-full bg-blue-500 text-white py-2 rounded"
          >Add Bookmark</button>

          <div>
            {bookmarks.map( (bookmark) => (
                   <div
                     key={bookmark.id}
                     className="border p-2 rounded flex justify-between"
                     >
                    <div>
                    <p className="font-semibold">{bookmark.title}</p>
                    <a
                     href={bookmark.url}
                     target="_blank"
                     className="text-blue-500 text-sm"
                      >
                    {bookmark.url}
                   </a>
                   </div>

                   <button onClick={() => handleDelete(bookmark.id)} className="text-red-500">Delete</button>

                   </div>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg"
          >
            Logout
          </button>
        </div>) : (
            <button
        onClick={handleLogin}
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Login with Google
      </button>
        )}
     

    </main>
  )
}
