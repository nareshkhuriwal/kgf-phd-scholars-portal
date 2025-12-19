// src/layout/constants/navSections.js
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TableViewIcon from '@mui/icons-material/TableView';
import LabelIcon from '@mui/icons-material/Label';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import RateReviewIcon from '@mui/icons-material/RateReview';
import QueueIcon from '@mui/icons-material/Queue';
import ArticleIcon from '@mui/icons-material/Article';
import SummarizeIcon from '@mui/icons-material/Summarize';
import LayersIcon from '@mui/icons-material/Layers';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment'; // new

export const SECTIONS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    base: '/dashboard',
    Icon: DashboardIcon,
    items: [
      // always visible
      { to: '/dashboard', label: 'Overview', Icon: DashboardIcon },
      // visible for admin, supervisor
      {
        to: '/dashboard/researchers',
        label: 'Researchers',
        Icon: GroupAddIcon,
        roles: ['admin', 'supervisor', 'super_admin'],
      },
      // visible for admin only
      {
        to: '/dashboard/supervisors',
        label: 'Supervisors',
        Icon: GroupAddIcon,
        roles: ['admin', 'super_admin'],
      },
    ],
  },
  {
    key: 'library',
    label: 'Library',
    base: '/library',
    Icon: LibraryBooksIcon,
    items: [
      { to: '/library/papers', label: 'All Papers', Icon: TableViewIcon },
      { to: '/library/upload', label: 'Upload / Import', Icon: CloudUploadIcon },
      { to: '/library/tags', label: 'Tags', Icon: LabelIcon },
    ],
  },
  {
    key: 'collections',
    label: 'Collections',
    base: '/collections',
    Icon: CollectionsBookmarkIcon,
    items: [
      { to: '/collections', label: 'All Collections', Icon: FolderSpecialIcon },
      // { to: '/collections/new', label: 'New Collection', Icon: PlaylistAddIcon },
    ],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    base: '/reviews',
    Icon: RateReviewIcon,
    items: [
      { to: '/reviews/queue', label: 'Review Queue', Icon: QueueIcon },
      { to: '/reviews/templates', label: 'Templates', Icon: ArticleIcon },
    ],
  },
  {
    key: 'chapters',
    label: 'Chapters',
    base: '/chapters',
    Icon: LayersIcon,
    items: [
      { to: '/chapters', label: 'All Chapters', Icon: LayersIcon },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    base: '/reports',
    Icon: SummarizeIcon,
    items: [
      { to: '/reports', label: 'All Reports', Icon: DescriptionIcon },
    ],
  },
  {
    key: 'researchers',
    label: 'Researchers',
    base: '/researchers',
    Icon: GroupAddIcon,
    roles: ['admin', 'supervisor', 'super_admin'],
    items: [
      { to: '/researchers', label: 'All Researchers', Icon: DescriptionIcon },
    ],
  },
  {
    key: 'supervisors',
    label: 'Supervisors',
    base: '/supervisors',
    Icon: GroupAddIcon,
    roles: ['admin', 'super_admin'],
    items: [
      { to: '/supervisors', label: 'All Supervisors', Icon: DescriptionIcon },
    ],
  },

  // Monitoring: visible only to super_admin
  {
    key: 'monitoring',
    label: 'Monitoring',
    base: '/monitoring',
    Icon: TableViewIcon,
    roles: ['super_admin'],
    items: [
      // inside the monitoring items array in src/layout/constants/navSections.js
      {
        to: '/monitoring/analytics',
        label: 'Analytics',
        Icon: TableViewIcon, // pick an icon you like
        roles: ['super_admin'],
      },
      {
        to: '/monitoring/users',
        label: 'Users',
        Icon: PersonIcon,
        roles: ['super_admin'],
      },
      {
        to: '/monitoring/payments',
        label: 'Payments',
        Icon: PaymentIcon,
        roles: ['super_admin'],
      },
    ],
  },
];
