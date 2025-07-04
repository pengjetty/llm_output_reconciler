"use client"
import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to the runs management page as the main entry point
  redirect("/runs")
  return null
}

// The rest of the code remains unchanged as it is not relevant for the HomePage component
