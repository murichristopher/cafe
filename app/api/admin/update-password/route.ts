import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Define the path to the admins.json file
const adminsFilePath = path.join(process.cwd(), 'data', 'admins.json');

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { adminId, newPassword } = await request.json();

    // Validate the input
    if (!adminId || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Admin ID and new password are required' },
        { status: 400 }
      );
    }

    // Read the current admins data
    const adminsData = JSON.parse(fs.readFileSync(adminsFilePath, 'utf8'));

    // Find the admin by ID
    const adminIndex = adminsData.findIndex((admin: any) => admin.id === adminId);

    if (adminIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }

    // Update the admin's password
    adminsData[adminIndex].password = newPassword;

    // Write the updated data back to the file
    fs.writeFileSync(adminsFilePath, JSON.stringify(adminsData, null, 2));

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating admin password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update password' },
      { status: 500 }
    );
  }
}