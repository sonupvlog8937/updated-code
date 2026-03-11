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
} from '@mui/material';
import { MdLocalPhone, MdOutlineMarkEmailRead } from 'react-icons/md';
import { SlCalender } from 'react-icons/sl';
import { FaCheckDouble } from 'react-icons/fa6';
import SearchBox from '../../Components/SearchBox';
import { MyContext } from '../../App';
// import { MdOutlineMarkEmailRead } from "react-icons/md";
import {
    deleteData,
    deleteMultipleData,
    editData,
    fetchDataFromApi,
    postData,
} from '../../utils/api';

const label = { inputProps: { 'aria-label': 'Checkbox demo' } };
const columns = [
    { id: 'user', label: 'USER', minWidth: 120 },
    { id: 'role', label: 'ROLE', minWidth: 100 },
    { id: 'status', label: 'STATUS', minWidth: 110 },
    { id: 'userPh', label: 'PHONE', minWidth: 130 },
    { id: 'verifyemail', label: 'EMAIL VERIFY', minWidth: 130 },
    { id: 'createdDate', label: 'CREATED', minWidth: 130 },
    { id: 'action', label: 'ACTION', minWidth: 260 },
];

const initialSellerForm = {
    name: '',
    email: '',
    password: '',
    mobile: '',
};


export const Users = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [userData, setUserData] = useState({});
    const [userTotalData, setUserTotalData] = useState({});
    const [isLoading, setIsloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortedIds, setSortedIds] = useState([]);
    const [sellerForm, setSellerForm] = useState(initialSellerForm);

    const context = useContext(MyContext);

    const getUsers = (pageNo, limit) => {
        setIsloading(true);
        setPage(pageNo);
        fetchDataFromApi(`/api/user/getAllUsers?page=${pageNo + 1}&limit=${limit}`).then(
            (res) => {
                setUserData(res);
                setUserTotalData(res);
                setIsloading(false);
            },
        );
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
        const updatedItems = userData?.users?.map((item) => ({
            ...item,
            checked: isChecked,
        }));

        setUserData({ ...userData, users: updatedItems });
        setSortedIds(isChecked ? updatedItems.map((item) => item._id) : []);
    };

    const handleCheckboxChange = (id) => {
        const updatedItems = userData?.users?.map((item) =>
            item._id === id ? { ...item, checked: !item.checked } : item,
        );

        setUserData({ ...userData, users: updatedItems });
        setSortedIds(
            updatedItems.filter((item) => item.checked).map((item) => item._id),
        );
    };

    const deleteMultiple = () => {
        if (sortedIds.length === 0) {
            context.alertBox('error', 'Please select items to delete.');
            return;


        }


        deleteMultipleData(`/api/user/deleteMultiple`, { data: { ids: sortedIds } }).then(
            () => {
                context.alertBox('success', 'Users deleted');
                setSortedIds([]);
                getUsers(page, rowsPerPage);
            },
        );
    };

    const deleteUser = (id) => {
        deleteData(`/api/user/deleteUser/${id}`).then(() => {
            context.alertBox('success', 'User deleted');
            getUsers(page, rowsPerPage);
        });
    };

    const updateUserAccess = (targetUserId, payload) => {
        editData('/api/user/admin/user-access', { userId: targetUserId, ...payload }).then(
            (res) => {
                context.alertBox('success', res?.message || 'Updated successfully');
                getUsers(page, rowsPerPage);
            },
        );
    };

    const createSeller = () => {
        if (!sellerForm.name || !sellerForm.email || !sellerForm.password) {
            context.alertBox('error', 'Name, email and password are required');
            return;
        }

        postData('/api/user/create-seller', sellerForm).then((res) => {
            if (res?.success) {
                context.alertBox('success', res.message || 'Seller created successfully');
                setSellerForm(initialSellerForm);
                getUsers(page, rowsPerPage);
            } else {
                context.alertBox('error', res?.message || 'Unable to create seller');
            }
        });
    };







    if (context?.userData?.role !== 'ADMIN') {
        return (
            <div className="card my-4 p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-[18px] font-[700] text-[#111827]">Access Restricted</h2>
                <p className="text-[14px] text-gray-600 mt-2">
                    Only admin can access Users & Sellers management.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="card my-2 pt-5 shadow-md sm:rounded-lg bg-white">
                <div className="px-5 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-[18px] font-[600]">Users & Sellers Management</h2>
                        <p className="text-[13px] text-gray-500 mt-1">
                            Admin can create seller accounts, change role and active/inactive/suspended status.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <TextField
                            size="small"
                            label="Seller Name"
                            value={sellerForm.name}
                            onChange={(e) => setSellerForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <TextField
                            size="small"
                            label="Seller Email"
                            value={sellerForm.email}
                            onChange={(e) => setSellerForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                        <TextField
                            size="small"
                            label="Seller Password"
                            type="password"
                            value={sellerForm.password}
                            onChange={(e) =>
                                setSellerForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                        />
                        <div className="flex gap-2">
                            <TextField
                                size="small"
                                label="Mobile"
                                value={sellerForm.mobile}
                                onChange={(e) =>
                                    setSellerForm((prev) => ({ ...prev, mobile: e.target.value }))
                                }
                                fullWidth
                            />
                            <Button variant="contained" onClick={createSeller}>
                                Add Seller
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center w-full px-5 pb-4 justify-between">
                    <div className="col">
                        {sortedIds?.length !== 0 && (
                            <Button variant="contained" size="small" color="error" onClick={deleteMultiple}>
                                Delete Selected
                            </Button>
                        )}
                    </div>

                    <div className="col w-[40%] ml-auto flex items-center gap-3">
                        <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </div>
                </div>

                <TableContainer sx={{ maxHeight: 520 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Checkbox
                                        {...label}
                                        size="small"
                                        onChange={handleSelectAll}
                                        checked={
                                            userData?.users?.length > 0
                                                ? userData?.users?.every((item) => item.checked)
                                                : false
                                        }
                                    />
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell key={column.id} style={{ minWidth: column.minWidth }}>
                                        <span className="whitespace-nowrap">{column.label}</span>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!isLoading ? (
                                userData?.users?.map((user, index) => (
                                    <TableRow key={index} className={user.checked ? '!bg-[#1976d21f]' : ''}>
                                        <TableCell>
                                            <Checkbox
                                                {...label}
                                                size="small"
                                                checked={!!user.checked}
                                                onChange={() => handleCheckboxChange(user._id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 w-[260px]">
                                                <img
                                                    src={user?.avatar ? user.avatar : '/user.jpg'}
                                                    className="w-[38px] h-[38px] rounded-md"
                                                />
                                                <div>
                                                    <span className="font-[500] block">{user?.name}</span>
                                                    <span className="flex items-center gap-1 text-[12px]">
                                                        <MdOutlineMarkEmailRead size={14} />
                                                        {user?.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={user?.role || 'USER'}
                                                onChange={(e) =>
                                                    updateUserAccess(user._id, { role: e.target.value })
                                                }
                                            >
                                                <MenuItem value="USER">USER</MenuItem>
                                                <MenuItem value="SELLER">SELLER</MenuItem>
                                                <MenuItem value="ADMIN">ADMIN</MenuItem>
                                            </Select>
                                        </TableCell>

                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={user?.status || 'Active'}
                                                onChange={(e) =>
                                                    updateUserAccess(user._id, { status: e.target.value })
                                                }
                                            >
                                                <MenuItem value="Active">Active</MenuItem>
                                                <MenuItem value="Inactive">Inactive</MenuItem>
                                                <MenuItem value="Suspended">Suspended</MenuItem>
                                            </Select>
                                        </TableCell>

                                        <TableCell>
                                            <span className="flex items-center gap-2">
                                                <MdLocalPhone /> {user?.mobile || 'NONE'}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            {user?.verify_email === false ? (
                                                <span className="inline-block py-1 px-3 rounded-full text-[11px] bg-red-500 text-white font-[500]">
                                                    Not Verify
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center justify-center gap-1 py-1 px-3 rounded-full text-[11px] bg-green-500 text-white font-[500]">
                                                    <FaCheckDouble /> Verified
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <span className="flex items-center gap-2">
                                                <SlCalender /> {user?.createdAt?.split('T')[0]}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <Button onClick={() => deleteUser(user?._id)} variant="outlined" color="error" size="small">
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <div className="flex items-center justify-center w-full min-h-[300px]">
                                            <CircularProgress color="inherit" />
                                        </div>

                                    </TableCell>
                                </TableRow>
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
                />
            </div>
        </>
    );
};
export default Users;
