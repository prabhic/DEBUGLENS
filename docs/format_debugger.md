# DebugLens Debugger Input Format Guide

## Overview

This document specifies the JSON-based format for debugger input files that DebugLens uses to visualize and analyze code execution.

## Input Format Structure

```json
{
  "session_id": "unique_debug_session_id",
  "timestamp": "2024-03-20T15:30:00Z",
  "scenario": {
    "title": "Process File Changes",
    "description": "Converting a list of files into blob objects for processing",
    "initial_state": {
      "file_system": {
        "example.py": "def process_files():\n    for content in changes:\n        blob = ...",
        "file1.txt": "Hello World",
        "file2.txt": "Test Content"
      }
    }
  },
  "execution": {
    "steps": [
      {
        "step_id": "step_122",
        "line": 10,
        "code": "for content in changes:",
        "action": "Start iteration over changes list",
        "beforeState": {
          "memory": {
            "changes": ["file1.txt", "file2.txt"]
          },
          "file_system": {
            "file1.txt": "Hello World",
            "file2.txt": "Test Content"
          }
        },
        "afterState": {
          "memory": {
            "changes": ["file1.txt", "file2.txt"],
            "content": "file1.txt"
          },
          "file_system": {
            "file1.txt": "Hello World",
            "file2.txt": "Test Content"
          }
        },
        "diff": {
          "added": ["memory.content = 'file1.txt'"],
          "removed": [],
          "unchanged": ["memory.changes", "file_system.*"]
        },
        "explanation": "Extracted first filename from changes list",
        "visualization": {
          "type": "memory_diagram",
          "highlights": ["content", "changes"]
        }
      }
    ]
  },
  "analysis": {
    "potential_issues": [
      {
        "type": "warning",
        "message": "No validation of file existence before processing",
        "suggestion": "Consider adding file existence check"
      }
    ]
  }
}
```

## Key Improvements

1. **JSON Structure**

   - Structured format makes parsing and processing easier
   - Nested objects provide better organization
   - Consistent data types across fields

2. **Step Data Tracking**

   - Input/output state for each execution step
   - Variable modifications tracking
   - Data flow analysis
   - Step history with timestamps
   - Argument and return value tracking

3. **Enhanced Code Context**

   - Added file information
   - Line-by-line structure with active line marking
   - Better code segment tracking

4. **Richer Variable State**

   - Type information included
   - Modification tracking
   - Structured nested data support
   - Memory usage information

5. **Detailed Execution Context**

   - Thread information
   - More detailed call stack
   - Scope tracking

6. **Advanced Breakpoint Handling**

   - Hit count tracking
   - Conditional breakpoint support
   - Better breakpoint state management

7. **Comprehensive Error Handling**

   - Structured stack traces
   - Error categorization
   - Line-specific error information

8. **Session Management**
   - Added session identification
   - Timestamp for temporal tracking
   - Better debugging session organization

## Additional LLM-Friendly Features

1. **Contextual Understanding**

   - Added code_context and code_purpose fields
   - Variable purpose descriptions
   - Step-by-step reasoning explanations

2. **Analysis Capabilities**

   - Code quality assessment
   - Potential issues detection
   - Improvement suggestions
   - Error explanations with fix suggestions

3. **Natural Language Integration**
   - Human-readable explanations for each step
   - Purpose descriptions for variables and operations
   - Clear reasoning for data flow changes

## Benefits

- **Visualization Ready**: Structured format makes it easier to create visual representations
- **Analysis Friendly**: JSON format enables easy parsing and analysis
- **Data Flow Visibility**: Clear tracking of how data changes between steps
- **Step-by-Step Debugging**: Detailed history of program execution
- **Input/Output Analysis**: Easy identification of data transformations
- **Extensible**: New fields can be added without breaking existing functionality
- **Language Agnostic**: Format works across different programming languages
- **Performance Optimized**: Structured data enables efficient processing
- **Enhanced Context**: LLMs can better understand and explain the code
- **Improved Explanations**: Natural language descriptions help in debugging
- **Better Suggestions**: Context-aware improvement recommendations
- **Educational Value**: Clear explanations for learning purposes
- **Automated Analysis**: LLMs can generate meaningful code insights
