<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Secure storage</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :scroll-y="false"
      class="ion-padding"
    >
      <div class="flex flex-col justify-start items-center w-full h-full pt-2 space-y-4">
        <ion-item
          v-if="!Capacitor.isNative"
          class="w-full"
          lines="none"
        >
          <ion-label position="stacked">
            Storage
          </ion-label>
          <ion-select
            v-model="storageType"
            interface="action-sheet"
            :interface-options="{ header: 'Select storage type' }"
            class="flex-initial max-w-full"
          >
            <ion-select-option value="sessionStorage">
              sessionStorage
            </ion-select-option>

            <ion-select-option value="localStorage">
              localStorage
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item class="w-full">
          <ion-label position="stacked">
            Prefix
          </ion-label>
          <div class="flex w-full">
            <ion-input
              v-model="prefix"
              type="text"
              class="flex-1"
            />
            <ion-button
              class="flex-initial ml-2"
              @click="onSetPrefix"
            >
              Set
            </ion-button>
          </div>
        </ion-item>

        <ion-item class="w-full">
          <ion-label position="stacked">
            Key
          </ion-label>
          <ion-input
            v-model="key"
            type="text"
            required
          />
        </ion-item>

        <ion-item
          lines="none"
          class="w-full"
        >
          <ion-label position="stacked">
            Data {{ dataType }}
          </ion-label>
          <ion-textarea
            v-model="data"
            class="bordered px-2"
            required
          />
        </ion-item>

        <div class="flex space-x-6">
          <ion-button @click="onStore">
            Set
          </ion-button>

          <ion-button @click="onRetrieve">
            Get
          </ion-button>

          <ion-button @click="onClear">
            Clear
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  alertController,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { Capacitor, Plugins } from '@capacitor/core'
import {
  StorageError,
  StorageType,
  WSSecureStoragePlugin
} from 'ws-capacitor-secure-storage'
import { onBeforeMount, ref, watch } from 'vue'

let storage: WSSecureStoragePlugin

export default {
  name: 'Default',

  components: {
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar
  },

  setup() {
    /*
     * ref
     */
    const key = ref('')
    const data = ref('')
    const dataType = ref('')
    const storageType = ref(StorageType[StorageType.localStorage])
    const prefix = ref('')

    /*
     * watch
     */
    watch(storageType, () => onChangeStorageType())

    /*
     * lifecycle
     */
    onBeforeMount(async () => {
      let key = process?.env?.WS_SECURE_STORAGE_KEY

      if (!key) {
        console.warn(
          'The encryption key should be set by the environment variable WS_SECURE_STORAGE_KEY or by calling'
        )
        key = 'This is just a placeholder'
      }

      storage = Plugins.WSSecureStorage as WSSecureStoragePlugin
      storage.setEncryptionKey(key)
      prefix.value = storage.getStoragePrefix()
    })

    /*
     * methods
     */
    function onChangeStorageType() {
      storage.setStorageType(
        storageType.value === 'sessionStorage'
          ? StorageType.sessionStorage
          : StorageType.localStorage
      )
    }

    async function onStore() {
      try {
        await storage.store({
          key: key.value,
          data: data.value
        })

        await showAlert(`Data stored successfully.`)
        data.value = ''
      } catch (e) {
        console.log(e)
        await showErrorAlert(e)
      }
    }

    async function onRetrieve() {
      try {
        const { data: result } = await storage.retrieve({ key: key.value })
        data.value = result
      } catch (e) {
        await showErrorAlert(e)
      }
    }

    async function onClear() {
      try {
        const { success } = await storage.clear({ key: key.value })

        if (success) {
          await showAlert(`Data for key "${key.value}" cleared successfully.`)
          data.value = ''
        } else {
          await showAlert(`There is no data with the key "${key.value}".`)
        }
      } catch (e) {
        await showErrorAlert(e)
      }
    }

    function onSetPrefix() {
      storage.setKeyPrefix({ prefix: prefix.value })
      showAlert(`Prefix set to "${prefix.value}".`)
    }

    function isStorageError(error: Error): error is StorageError {
      // eslint-disable-next-line no-prototype-builtins
      return error?.hasOwnProperty('code')
    }

    async function showErrorAlert(error: Error) {
      let message = error.message

      if (isStorageError(error)) {
        message += ` [${error.code}]`
      }

      await showAlert(message + '.')
    }

    async function showAlert(message: string) {
      const alert = await alertController.create({
        header: `The plugin says:`,
        subHeader: '',
        message,
        buttons: ['OK']
      })
      await alert.present()
    }

    return {
      Capacitor,
      data,
      dataType,
      key,
      onChangeStorageType,
      onClear,
      onRetrieve,
      onSetPrefix,
      onStore,
      prefix,
      storageType
    }
  }
}
</script>

<style scoped>
ion-textarea.bordered {
  border-width: 1px;
  border-color: var(--ion-color-step-250, #c8c7cc);
}
</style>
