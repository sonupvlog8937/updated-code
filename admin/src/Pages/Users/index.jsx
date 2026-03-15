import React, { useContext, useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    CircularProgress,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Tooltip,
    IconButton,
    InputAdornment,
    Avatar,
    Badge,
    Fade,
    Skeleton,
} from '@mui/material';
import { MdLocalPhone, MdOutlineMarkEmailRead, MdSearch, MdRefresh, MdClose } from 'react-icons/md';
import { SlCalender } from 'react-icons/sl';
import { FaCheckDouble, FaUserShield, FaStore, FaUsers, FaUserPlus } from 'react-icons/fa6';
import { MdDeleteOutline, MdPersonOff, MdWarning } from 'react-icons/md';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import SearchBox from '../../Components/SearchBox';
import { MyContext } from '../../App';
import {
    deleteData,
    deleteMultipleData,
    editData,
    fetchDataFromApi,
    postData,
} from '../../utils/api';

const label = { inputProps: { 'aria-label': 'Checkbox demo' } };

const columns = [
    { id: 'user', label: 'USER', minWidth: 220 },
    { id: 'role', label: 'ROLE', minWidth: 120 },
    { id: 'status', label: 'STATUS', minWidth: 120 },
    { id: 'userPh', label: 'PHONE', minWidth: 140 },
    { id: 'verifyemail', label: 'EMAIL VERIFY', minWidth: 140 },
    { id: 'createdDate', label: 'CREATED', minWidth: 130 },
    { id: 'action', label: 'ACTION', minWidth: 100 },
];

const initialSellerForm = {
    name: '',
    email: '',
    password: '',
    mobile: '',
};

const roleConfig = {
    ADMIN: { color: '#7c3aed', bg: '#ede9fe', icon: <FaUserShield size={11} /> },
    SELLER: { color: '#0369a1', bg: '#e0f2fe', icon: <FaStore size={11} /> },
    USER: { color: '#374151', bg: '#f3f4f6', icon: <FaUsers size={11} /> },
};

const statusConfig = {
    Active: { color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
    Inactive: { color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
    Suspended: { color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
};

const StatCard = ({ label, value, icon, color, bg }) => (
    <div
        style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            minWidth: 0,
        }}
    >
        <div
            style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                fontSize: 20,
                flexShrink: 0,
            }}
        >
            {icon}
        </div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {value ?? <Skeleton width={40} height={28} />}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: 500 }}>
                {label}
            </div>
        </div>
    </div>
);

export const Users = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [userData, setUserData] = useState({});
    const [userTotalData, setUserTotalData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortedIds, setSortedIds] = useState([]);
    const [sellerForm, setSellerForm] = useState(initialSellerForm);
    const [showPassword, setShowPassword] = useState(false);
    const [addSellerOpen, setAddSellerOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, multiple }
    const [formErrors, setFormErrors] = useState({});

    const context = useContext(MyContext);

    const getUsers = (pageNo, limit) => {
        setIsLoading(true);
        setPage(pageNo);
        fetchDataFromApi(`/api/user/getAllUsers?page=${pageNo + 1}&limit=${limit}`).then((res) => {
            setUserData(res);
            setUserTotalData(res);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        getUsers(page, rowsPerPage);
    }, [page, rowsPerPage]);

    useEffect(() => {
        if (searchQuery !== '') {
            const filteredItems = userTotalData?.totalUsers?.filter(
                (user) =>
                    user._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user?.role?.toLowerCase().includes(searchQuery.toLowerCase()),
            );
            setUserData({
                error: false,
                success: true,
                users: filteredItems,
                total: filteredItems?.length,
                page: Number(page),
                totalPages: Math.ceil((filteredItems?.length || 0) / rowsPerPage),
                totalUsersCount: userTotalData?.totalUsersCount,
            });
        } else {
            getUsers(page, rowsPerPage);
        }
    }, [searchQuery]);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        const updatedItems = userData?.users?.map((item) => ({ ...item, checked: isChecked }));
        setUserData({ ...userData, users: updatedItems });
        setSortedIds(isChecked ? updatedItems.map((item) => item._id) : []);
    };

    const handleCheckboxChange = (id) => {
        const updatedItems = userData?.users?.map((item) =>
            item._id === id ? { ...item, checked: !item.checked } : item,
        );
        setUserData({ ...userData, users: updatedItems });
        setSortedIds(updatedItems.filter((item) => item.checked).map((item) => item._id));
    };

    const confirmDelete = (id, name, multiple = false) => {
        setDeleteTarget({ id, name, multiple });
        setDeleteDialogOpen(true);
    };

    const handleConfirmedDelete = () => {
        if (deleteTarget?.multiple) {
            deleteMultipleData(`/api/user/deleteMultiple`, { data: { ids: sortedIds } }).then(() => {
                context.alertBox('success', `${sortedIds.length} users deleted`);
                setSortedIds([]);
                getUsers(page, rowsPerPage);
            });
        } else {
            deleteData(`/api/user/deleteUser/${deleteTarget.id}`).then(() => {
                context.alertBox('success', 'User deleted');
                getUsers(page, rowsPerPage);
            });
        }
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
    };

    const updateUserAccess = (targetUserId, payload) => {
        editData('/api/user/admin/user-access', { userId: targetUserId, ...payload }).then((res) => {
            context.alertBox('success', res?.message || 'Updated successfully');
            getUsers(page, rowsPerPage);
        });
    };

    const validateSellerForm = () => {
        const errors = {};
        if (!sellerForm.name.trim()) errors.name = 'Name is required';
        if (!sellerForm.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerForm.email)) errors.email = 'Invalid email';
        if (!sellerForm.password) errors.password = 'Password is required';
        else if (sellerForm.password.length < 6) errors.password = 'Min 6 characters';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const createSeller = () => {
        if (!validateSellerForm()) return;
        postData('/api/user/create-seller', sellerForm).then((res) => {
            if (res?.success) {
                context.alertBox('success', res.message || 'Seller created successfully');
                setSellerForm(initialSellerForm);
                setFormErrors({});
                setAddSellerOpen(false);
                getUsers(page, rowsPerPage);
            } else {
                context.alertBox('error', res?.message || 'Unable to create seller');
            }
        });
    };

    // Stats derived
    const allUsers = userTotalData?.totalUsers || [];
    const totalCount = userTotalData?.totalUsersCount || 0;
    const adminCount = allUsers.filter((u) => u.role === 'ADMIN').length;
    const sellerCount = allUsers.filter((u) => u.role === 'SELLER').length;
    const activeCount = allUsers.filter((u) => u.status === 'Active').length;

    if (context?.userData?.role !== 'ADMIN') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 24px',
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                    margin: '24px 0',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#fee2e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        fontSize: 28,
                        color: '#dc2626',
                    }}
                >
                    <MdPersonOff />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
                    Access Restricted
                </h2>
                <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8, maxWidth: 320 }}>
                    Only administrators can access the Users & Sellers management panel.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* ── Page Header ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
                            Users & Sellers
                        </h1>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                            Manage user accounts, roles, and access permissions
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Tooltip title="Refresh list">
                            <IconButton
                                onClick={() => getUsers(page, rowsPerPage)}
                                size="small"
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 8,
                                    padding: '7px',
                                    background: '#fff',
                                    color: '#374151',
                                }}
                            >
                                <MdRefresh size={18} />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            startIcon={<FaUserPlus size={14} />}
                            onClick={() => setAddSellerOpen(true)}
                            style={{
                                background: '#111827',
                                borderRadius: 8,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: 13,
                                padding: '8px 16px',
                                boxShadow: 'none',
                            }}
                        >
                            Add Seller
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 14,
                    marginBottom: 20,
                }}
            >
                <StatCard label="Total Users" value={totalCount} icon={<FaUsers />} color="#7c3aed" bg="#ede9fe" />
                <StatCard label="Active Users" value={activeCount || '--'} icon={<FaCheckDouble />} color="#15803d" bg="#dcfce7" />
                <StatCard label="Sellers" value={sellerCount || '--'} icon={<FaStore />} color="#0369a1" bg="#e0f2fe" />
                <StatCard label="Admins" value={adminCount || '--'} icon={<FaUserShield />} color="#b45309" bg="#fef3c7" />
            </div>

            {/* ── Main Card ── */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                }}
            >
                {/* Toolbar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        borderBottom: '1px solid #f3f4f6',
                        flexWrap: 'wrap',
                        gap: 12,
                        background: '#fafafa',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {sortedIds.length > 0 && (
                            <Fade in>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Chip
                                        label={`${sortedIds.length} selected`}
                                        size="small"
                                        style={{
                                            background: '#ede9fe',
                                            color: '#7c3aed',
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<MdDeleteOutline size={16} />}
                                        onClick={() => confirmDelete(null, null, true)}
                                        style={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: 12,
                                            borderRadius: 7,
                                        }}
                                    >
                                        Delete Selected
                                    </Button>
                                </div>
                            </Fade>
                        )}
                    </div>
                    <div style={{ width: 260 }}>
                        <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </div>
                </div>

                {/* Table */}
                <TableContainer sx={{ maxHeight: 540 }}>
                    <Table stickyHeader size="small" aria-label="users table">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    padding="checkbox"
                                    sx={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', pl: 2 }}
                                >
                                    <Checkbox
                                        {...label}
                                        size="small"
                                        onChange={handleSelectAll}
                                        checked={
                                            userData?.users?.length > 0
                                                ? userData?.users?.every((item) => item.checked)
                                                : false
                                        }
                                        indeterminate={
                                            sortedIds.length > 0 &&
                                            sortedIds.length < (userData?.users?.length || 0)
                                        }
                                    />
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        sx={{
                                            background: '#f9fafb',
                                            borderBottom: '2px solid #e5e7eb',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: '#6b7280',
                                            letterSpacing: '0.06em',
                                            minWidth: column.minWidth,
                                            py: 1.5,
                                        }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                            <Skeleton variant="rectangular" width={16} height={16} sx={{ borderRadius: 1 }} />
                                        </TableCell>
                                        {columns.map((col) => (
                                            <TableCell key={col.id}>
                                                <Skeleton variant="text" width="80%" height={20} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : userData?.users?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <div
                                            style={{
                                                textAlign: 'center',
                                                padding: '48px 0',
                                                color: '#9ca3af',
                                            }}
                                        >
                                            <FaUsers size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>No users found</div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                Try adjusting the search query
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                userData?.users?.map((user, index) => (
                                    <TableRow
                                        key={user._id || index}
                                        hover
                                        sx={{
                                            background: user.checked ? '#f5f3ff !important' : 'inherit',
                                            '&:hover': { background: '#fafafa' },
                                            transition: 'background 0.15s',
                                            borderLeft: user.checked ? '3px solid #7c3aed' : '3px solid transparent',
                                        }}
                                    >
                                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                            <Checkbox
                                                {...label}
                                                size="small"
                                                checked={!!user.checked}
                                                onChange={() => handleCheckboxChange(user._id)}
                                            />
                                        </TableCell>

                                        {/* User */}
                                        <TableCell>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar
                                                    src={user?.avatar || '/user.jpg'}
                                                    alt={user?.name}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 2,
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        background: '#7c3aed',
                                                    }}
                                                >
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                                                        {user?.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#6b7280',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                            marginTop: 1,
                                                        }}
                                                    >
                                                        <MdOutlineMarkEmailRead size={12} />
                                                        {user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Role */}
                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={user?.role || 'USER'}
                                                onChange={(e) =>
                                                    updateUserAccess(user._id, { role: e.target.value })
                                                }
                                                sx={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    minWidth: 100,
                                                    background: roleConfig[user?.role]?.bg || '#f3f4f6',
                                                    color: roleConfig[user?.role]?.color || '#374151',
                                                    borderRadius: '20px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: 'none',
                                                    },
                                                    '& .MuiSelect-icon': {
                                                        color: roleConfig[user?.role]?.color || '#374151',
                                                    },
                                                }}
                                            >
                                                <MenuItem value="USER">USER</MenuItem>
                                                <MenuItem value="SELLER">SELLER</MenuItem>
                                                <MenuItem value="ADMIN">ADMIN</MenuItem>
                                            </Select>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={user?.status || 'Active'}
                                                onChange={(e) =>
                                                    updateUserAccess(user._id, { status: e.target.value })
                                                }
                                                sx={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    minWidth: 110,
                                                    background: statusConfig[user?.status]?.bg || '#dcfce7',
                                                    color: statusConfig[user?.status]?.color || '#15803d',
                                                    borderRadius: '20px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        border: 'none',
                                                    },
                                                    '& .MuiSelect-icon': {
                                                        color: statusConfig[user?.status]?.color || '#15803d',
                                                    },
                                                }}
                                                renderValue={(val) => (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span
                                                            style={{
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: '50%',
                                                                background: statusConfig[val]?.dot || '#22c55e',
                                                                flexShrink: 0,
                                                                display: 'inline-block',
                                                            }}
                                                        />
                                                        {val}
                                                    </span>
                                                )}
                                            >
                                                <MenuItem value="Active">Active</MenuItem>
                                                <MenuItem value="Inactive">Inactive</MenuItem>
                                                <MenuItem value="Suspended">Suspended</MenuItem>
                                            </Select>
                                        </TableCell>

                                        {/* Phone */}
                                        <TableCell>
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    fontSize: 12,
                                                    color: user?.mobile ? '#111827' : '#9ca3af',
                                                }}
                                            >
                                                <MdLocalPhone size={13} />
                                                {user?.mobile || '—'}
                                            </span>
                                        </TableCell>

                                        {/* Email Verify */}
                                        <TableCell>
                                            {user?.verify_email === false ? (
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        background: '#fee2e2',
                                                        color: '#991b1b',
                                                    }}
                                                >
                                                    Not Verified
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        background: '#dcfce7',
                                                        color: '#15803d',
                                                    }}
                                                >
                                                    <FaCheckDouble size={10} /> Verified
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Created */}
                                        <TableCell>
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    fontSize: 12,
                                                    color: '#6b7280',
                                                }}
                                            >
                                                <SlCalender size={12} />
                                                {user?.createdAt?.split('T')[0] || '—'}
                                            </span>
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell>
                                            <Tooltip title="Delete user" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => confirmDelete(user?._id, user?.name)}
                                                    sx={{
                                                        color: '#ef4444',
                                                        background: '#fee2e2',
                                                        borderRadius: 1.5,
                                                        width: 30,
                                                        height: 30,
                                                        '&:hover': { background: '#fecaca' },
                                                    }}
                                                >
                                                    <MdDeleteOutline size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[25, 50, 100]}
                    component="div"
                    count={(userData?.totalPages || 0) * rowsPerPage}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid #f3f4f6', fontSize: 13 }}
                />
            </div>

            {/* ── Add Seller Dialog ── */}
            <Dialog
                open={addSellerOpen}
                onClose={() => { setAddSellerOpen(false); setFormErrors({}); setSellerForm(initialSellerForm); }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    style: { borderRadius: 14, padding: '4px 0' },
                }}
            >
                <DialogTitle
                    sx={{
                        fontSize: 16,
                        fontWeight: 700,
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaUserPlus size={16} />
                        Create Seller Account
                    </span>
                    <IconButton
                        size="small"
                        onClick={() => { setAddSellerOpen(false); setFormErrors({}); setSellerForm(initialSellerForm); }}
                        sx={{ color: '#6b7280' }}
                    >
                        <MdClose size={18} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        size="small"
                        label="Full Name"
                        value={sellerForm.name}
                        onChange={(e) => setSellerForm((prev) => ({ ...prev, name: e.target.value }))}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        fullWidth
                    />
                    <TextField
                        size="small"
                        label="Email Address"
                        type="email"
                        value={sellerForm.email}
                        onChange={(e) => setSellerForm((prev) => ({ ...prev, email: e.target.value }))}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        fullWidth
                    />
                    <TextField
                        size="small"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={sellerForm.password}
                        onChange={(e) => setSellerForm((prev) => ({ ...prev, password: e.target.value }))}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowPassword((p) => !p)}
                                        edge="end"
                                    >
                                        {showPassword ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        fullWidth
                    />
                    <TextField
                        size="small"
                        label="Mobile (optional)"
                        value={sellerForm.mobile}
                        onChange={(e) => setSellerForm((prev) => ({ ...prev, mobile: e.target.value }))}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => { setAddSellerOpen(false); setFormErrors({}); setSellerForm(initialSellerForm); }}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createSeller}
                        sx={{
                            background: '#111827',
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': { background: '#1f2937', boxShadow: 'none' },
                        }}
                    >
                        Create Seller
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Confirmation Dialog ── */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ style: { borderRadius: 14 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#111827',
                        }}
                    >
                        <span
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#dc2626',
                            }}
                        >
                            <MdWarning size={17} />
                        </span>
                        Confirm Delete
                    </span>
                </DialogTitle>
                <DialogContent>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
                        {deleteTarget?.multiple
                            ? `Are you sure you want to delete ${sortedIds.length} selected users? This action cannot be undone.`
                            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    </p>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmedDelete}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 600,
                            boxShadow: 'none',
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Users;