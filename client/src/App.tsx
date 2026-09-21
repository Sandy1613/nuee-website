import type { ComponentType } from "react";
import { Switch, Route } from "wouter";
import { TableBookingModalProvider } from "@/context/TableBookingModalContext";
import { TableReservationModal } from "@/components/TableReservationModal";
import { PublicLayout } from "@/components/PublicLayout";

import Home from "@/pages/Home";
import Events from "@/pages/Events";
import EventDetails from "@/pages/EventDetails";
import Menu from "@/pages/Menu";
import About from "@/pages/About";
import Visit from "@/pages/Visit";
import BookingConfirmation from "@/pages/BookingConfirmation";
import NotFound from "@/pages/NotFound";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminEventForm from "@/pages/admin/AdminEventForm";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminTableReservations from "@/pages/admin/AdminTableReservations";
import AdminMenu from "@/pages/admin/AdminMenu";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminFaqs from "@/pages/admin/AdminFaqs";
import AdminContent from "@/pages/admin/AdminContent";
import AdminSettings from "@/pages/admin/AdminSettings";

function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/events" component={Events} />
        <Route path="/events/:slug" component={EventDetails} />
        <Route path="/menu" component={Menu} />
        <Route path="/about" component={About} />
        <Route path="/visit" component={Visit} />
        <Route path="/booking-confirmation/:reference" component={BookingConfirmation} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}

function AdminRoute({ component: Component }: { component: ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

export default function App() {
  return (
    <TableBookingModalProvider>
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin"><AdminRoute component={AdminOverview} /></Route>
        <Route path="/admin/events"><AdminRoute component={AdminEvents} /></Route>
        <Route path="/admin/events/new"><AdminRoute component={AdminEventForm} /></Route>
        <Route path="/admin/events/:id"><AdminRoute component={AdminEventForm} /></Route>
        <Route path="/admin/bookings"><AdminRoute component={AdminBookings} /></Route>
        <Route path="/admin/table-reservations"><AdminRoute component={AdminTableReservations} /></Route>
        <Route path="/admin/menu"><AdminRoute component={AdminMenu} /></Route>
        <Route path="/admin/reviews"><AdminRoute component={AdminReviews} /></Route>
        <Route path="/admin/faqs"><AdminRoute component={AdminFaqs} /></Route>
        <Route path="/admin/content"><AdminRoute component={AdminContent} /></Route>
        <Route path="/admin/settings"><AdminRoute component={AdminSettings} /></Route>
        <Route path="/admin/:rest*"><AdminRoute component={NotFound} /></Route>
        <Route>
          <PublicRoutes />
        </Route>
      </Switch>
      <TableReservationModal />
    </TableBookingModalProvider>
  );
}
