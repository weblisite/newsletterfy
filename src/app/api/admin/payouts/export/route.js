import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { getSupabaseClient } from '@/lib/auth-utils';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { parse } from 'json2csv';

export async function GET(req) {
  try {
    const { isAdmin, error: authError } = await checkAdminAuth();

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);

    const supabase = getSupabaseClient();

    // Fetch payouts with user details
    let query = supabase
      .from('payouts')
      .select(`
        *,
        users:user_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply ID filter if provided
    if (ids?.length > 0) {
      query = query.in('id', ids);
    }

    const { data: payouts, error } = await query;

    if (error) {
      throw error;
    }

    // Format data for export
    const formattedPayouts = payouts.map(payout => ({
      ID: payout.id,
      User: payout.users.full_name,
      Email: payout.users.email,
      Amount: payout.amount,
      Status: payout.status,
      'Payout Method': payout.payout_method,
      'Created At': format(new Date(payout.created_at), 'PPpp'),
      'Completed At': payout.completed_at ? format(new Date(payout.completed_at), 'PPpp') : '',
      'Payment Details': JSON.stringify(payout.payment_details),
      Notes: payout.notes || '',
      Error: payout.error || ''
    }));

    // Generate export file based on format
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payouts');

      // Add headers
      worksheet.columns = Object.keys(formattedPayouts[0]).map(key => ({
        header: key,
        key,
        width: 20
      }));

      // Add rows
      worksheet.addRows(formattedPayouts);

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      const buffer = await workbook.xlsx.writeBuffer();

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=payouts-${format}-${new Date().toISOString().split('T')[0]}.xlsx`
        }
      });
    } else {
      // CSV format
      const csv = parse(formattedPayouts, {
        fields: Object.keys(formattedPayouts[0])
      });

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=payouts-${format}-${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }
  } catch (error) {
    console.error('Error exporting payouts:', error);
    return NextResponse.json(
      { error: 'Failed to export payouts' },
      { status: 500 }
    );
  }
} 