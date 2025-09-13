'use client';

import * as React from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageInfo?: { page: number; limit: number; total: number; has_next: boolean };
    onPageChange?: (page: number) => void; // 1-based
    className?: string;
};

export function DataTable<TData, TValue>({
    columns,
    data,
    pageInfo,
    onPageChange,
    className,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const page = pageInfo?.page ?? 1;
    const total = pageInfo?.total ?? data.length;
    const limit = pageInfo?.limit ?? data.length;
    const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));

    return (
        <div className={cn('w-full', className)}>
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id} className='whitespace-nowrap'>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    데이터가 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 서버페이징 컨트롤 */}
            {pageInfo && onPageChange && (
                <div className='flex items-center justify-end gap-2 py-4'>
                    <span className='text-sm text-muted-foreground'>
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                    >
                        이전
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                    >
                        다음
                    </Button>
                </div>
            )}
        </div>
    );
}
