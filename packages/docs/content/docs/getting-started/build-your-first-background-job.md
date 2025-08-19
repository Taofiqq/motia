---
title: Build Your First Background Jobs in Motia (TypeScript)
description: Learn how to add background job processing to your REST API using Motia's event system and state management. This guide covers job queues, workers, and asynchronous task processing.
---

Background jobs are essential for handling tasks that take time and shouldn't block your API responses. When users create a pet in your store, you want to respond immediately while handling time-consuming tasks like sending emails or updating analytics in the background.

In our previous REST API tutorial, we built endpoints that respond instantly. Now we'll extend that pet store API to process tasks asynchronously using Motia's event system and state management. You'll learn how to queue jobs, process them with workers, and handle background tasks without external dependencies.
