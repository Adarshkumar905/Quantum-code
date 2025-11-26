import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
    component :RootComponent,
    notFoundComponent :NotFoundComponent,
});

function RootComponent(){
   return (
   <main className="min-h-screen flex flex-col bg-black">
    <Outlet />
    </main>
   );
}
function NotFoundComponent(){
    return <h1>NOT FOUND!</h1>;
 
 }

