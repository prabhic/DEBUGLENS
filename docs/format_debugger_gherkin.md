# DebugLens Debug Scenario Format Guide

## Overview

This document specifies the Gherkin-style format for describing how code executes in specific scenarios. This format provides all necessary information for DebugLens to visualize the execution flow, state changes, and data transformations.

## Format Structure

```gherkin
Feature: Git Stage File Operation
  Description: How Git stages a file into the index
  Source: https://github.com/git/git/blob/master/builtin/add.c

  Background:
    Given the working directory contains:
      | Path        | Content      | Type |
      | example.txt | Hello World! | file |
      | .git/       |             | dir  |
    And the initial Git state is:
      | Component     | State   |
      | staging_area  | empty   |
      | object_store  | empty   |

  Scenario: Staging a new file
    # Step 1: Read file content
    When the command "git add example.txt" is executed
    Then function "read_file" is called with:
      | Parameter | Value       |
      | path     | example.txt |
    And the memory state becomes:
      | Variable | Value        | Type   |
      | content  | Hello World! | string |
    And the file system remains unchanged

    # Step 2: Create blob object
    When function "hash_object" is called with:
      | Parameter | Value        |
      | content   | Hello World! |
    Then a new blob object is created:
      | Property     | Value                                      |
      | type        | blob                                       |
      | content     | Hello World!                               |
      | hash        | 8c7e5a667f1b771847fe88c01c3de34413a1b08d |
    And the object store is updated:
      | Path                                               | Content      |
      | .git/objects/8c/7e5a667f1b771847fe88c01c3de34413a1b08d | Hello World! |

    # Step 3: Update index
    When function "update_index" is called with:
      | Parameter  | Value                                      |
      | path      | example.txt                                |
      | blob_hash | 8c7e5a667f1b771847fe88c01c3de34413a1b08d |
    Then the staging area is updated:
      | Path        | Blob Hash                                  | Mode   |
      | example.txt | 8c7e5a667f1b771847fe88c01c3de34413a1b08d | 100644 |
    And the index file contains:
      """
      DIRC
      example.txt 100644 8c7e5a667f1b771847fe88c01c3de34413a1b08d
      """

    # Final State
    Then the operation completes with:
      | Component     | Final State                              |
      | working_dir   | unchanged                                |
      | staging_area  | contains example.txt                     |
      | object_store  | contains blob 8c7e5a                     |

    And the data flow sequence was:
      | Step | Operation    | Input         | Output        |
      | 1    | read_file   | file path     | content       |
      | 2    | hash_object | content       | blob hash     |
      | 3    | update_index| path + hash   | updated index |

  @InternalDetails
  Scenario: Internal State Transitions
    # This section describes internal state changes for debugging
    Given step "hash_object" is being executed
    Then the internal state changes are:
      | Component    | Before        | After         | Reason                |
      | memory      | content only  | content+hash  | Hash calculation      |
      | object_store| empty         | has blob      | Blob object creation  |
      | file_system | no objects    | blob file     | Persistent storage    |
```

## Format Components

1. **Background**

   - Initial system state
   - File system setup
   - Required preconditions

2. **Steps**

   - Function calls with parameters
   - State changes after each operation
   - Memory state updates
   - File system modifications

3. **State Tracking**

   - Before/after states
   - Variable values
   - File system changes
   - Internal data structures

4. **Data Flow**

   - Input/output for each step
   - Data transformations
   - State transitions
   - Operation sequence

5. **Internal Details**
   - Component-level state changes
   - Memory updates
   - File system modifications
   - Data structure changes

## Benefits

- Clear representation of execution flow
- Detailed state changes at each step
- Complete data flow visibility
- Internal state tracking for debugging
- Easy to understand operation sequence
