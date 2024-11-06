# DebugLens Pseudocode Format Guide

## Overview

This document outlines the format for writing pseudocode files (.pseudo) in DebugLens.

## Format Rules

1. Comments

   - Use # for single line comments
   - Comments should be clear and explain high-level logic

2. Data Structures

   - Define using simple key-value pairs in dictionaries/objects
   - Example: `repo = { "latest_commit": None }`
   - Arrays/lists shown with square brackets: `[]`

3. Variables

   - Use descriptive names in snake_case
   - Initialize with clear initial values
   - Example: `commit_message = "Initial commit"`

4. Operations

   - Write in plain English-like syntax
   - Use indentation for nested operations
   - Example:
     ```
     for content in changes:
         blob = { "content": content }
     ```

5. Functions/Procedures

   - Start with action verb
   - Use clear parameter names
   - Example: `create_commit(message, parent, tree)`

6. State Changes

   - Show explicit updates to data structures
   - Example: `repo["latest_commit"] = commit`

7. Output/Results
   - Use comments to show final state or output
   - Example:
     ```
     # Emit final structure:
     # repo: { "latest_commit": commit }
     ```

## Example

See `test/data/gitsinglefile.pseudo` for a complete example of proper pseudocode formatting.
